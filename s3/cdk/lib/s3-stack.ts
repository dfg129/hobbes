import { ContextProvider, RemovalPolicy, Stack, StackProps, CfnOutput, Aws} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3objectlambda from 'aws-cdk-lib/aws-s3objectlambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyDocument } from 'aws-cdk-lib/aws-iam';
import { AccessPoint } from 'aws-cdk-lib/aws-efs';
import { CfnDisk } from 'aws-cdk-lib/aws-lightsail';
import { Bucket } from 'aws-cdk-lib/aws-s3';


const S3_ACCESS_POINT_NAME = 'read-data-object';

export class S3Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const accessPoint = `arn:aws:s3:${Aws.REGION}:${Aws.ACCOUNT_ID}:accesspoint/${S3_ACCESS_POINT_NAME}`;

    const dataBucket = new s3.Bucket(this, 'DatafileBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    let parameter = new ssm.StringParameter(this, 'HobbesEventBus', {
      allowedPattern:'.*',
      description: 'Datafiles bucket name',
      parameterName: 'DatafilesBucket',
      tier: ssm.ParameterTier.ADVANCED,
      stringValue: dataBucket.bucketName,
    });
    
    const policyResult = dataBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AccountPrincipal(this.account)],
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
      ],
      resources: [`${dataBucket.bucketArn}/*`],
    }));
    
    let docker_dir = path.join(__dirname, '../../lambda');

    let split_file_fn = new lambda.DockerImageFunction(this, 'SplitFileLambda', {
          code: lambda.DockerImageCode.fromImageAsset(docker_dir),
          description: 'Split a data file into multiples',
          architecture: lambda.Architecture.ARM_64,
          environment: {
            RUST_BACKTRACE: '1',
            DATAFILE_BUCKET_NAME: dataBucket.bucketName,
          },
          logRetention: RetentionDays.ONE_DAY,
    });

    split_file_fn.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ["*"],
      actions: ['s3-object-lambda:WriteGetObjectResponse'],
    }));

    parameter.grantRead(split_file_fn);
    dataBucket.grantRead(split_file_fn);

    const policyDoc = new iam.PolicyDocument();
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [ new iam.ArnPrincipal(<string>split_file_fn.role?.roleArn) ],
      resources: [`${accessPoint}/object/*`]
      //resources: [`${dataBucket.bucketArn}`, `${dataBucket.bucketArn}/*`],
    });
      
    policyStatement.sid = 'AllowLambdaToUseAccessPoint';
    policyDoc.addStatements(policyStatement);

    const s3AccessPnt = new s3.CfnAccessPoint(this, 's3AccessPnt', {
      bucket: dataBucket.bucketName,
      name: S3_ACCESS_POINT_NAME,
    //  policy: policyDoc,
    });

    let accessPntName = accessPoint; //s3AccessPnt.name!;

    if (accessPntName != null) {
      const objectLambdaPnt = new s3objectlambda.CfnAccessPoint(this, 's3ObjectLambdaPnt', {
          objectLambdaConfiguration: {
          supportingAccessPoint: accessPntName,
          transformationConfigurations: [{
            actions: ['GetObject'],
            contentTransformation: {
              'AwsLambda': {
                'FunctionArn':  `${split_file_fn.functionArn}`,
              }
            }
          }]
        }
      });

    dataBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(split_file_fn), {prefix: '*'});

    new CfnOutput(this, 'testBucketArn', { value: dataBucket.bucketArn });
    new CfnOutput(this, 'split_file_fnArn', { value: split_file_fn.functionArn });
    new CfnOutput(this, 'objectLambdaPntArn', { value: objectLambdaPnt.attrArn });
    new CfnOutput(this, 'objectLambdaPntUrl', { 
      value: `https://console.aws.amazon.com/s3/olap/${Aws.ACCOUNT_ID}/${objectLambdaPnt.name}?region=${Aws.REGION}`
    });
    }   
  }
}
