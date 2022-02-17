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


const S3_ACCESS_POINT_NAME = 'read-data-object';

export class S3ObjLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const accessPoint = `arn:aws:s3:${Aws.REGION}:${Aws.ACCOUNT_ID}:accesspoint/${S3_ACCESS_POINT_NAME}`;

    const databucket =  ssm.StringParameter.fromStringParameterAttributes(this, 'DatabucketParam', {
      parameterName: 'DatafilesBucket',
    }).stringValue;

    let docker_dir = path.join(__dirname, '../../lambda_object_access_point');

    let object_lambda_access_fn = new lambda.DockerImageFunction(this, 'ObjectLambdaAccessFn', {
      code: lambda.DockerImageCode.fromImageAsset(docker_dir),
      description: 'Access the Object Lambda Url',
      architecture: lambda.Architecture.ARM_64,
      environment: {
        RUST_BACKTRACE: '1',
        DATAFILE_BUCKET_NAME: databucket,
      },
      logRetention: RetentionDays.ONE_DAY,
    });

    const policyDoc = new iam.PolicyDocument();
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [ new iam.ArnPrincipal(<string>object_lambda_access_fn.role?.roleArn) ],
      resources: [`${accessPoint}/object/*`]
    });
      
    policyStatement.sid = 'AllowLambdaToUseAccessPoint';
    policyDoc.addStatements(policyStatement);

    const s3AccessPnt = new s3.CfnAccessPoint(this, 's3AccessPnt', {
      bucket: databucket,
      name: S3_ACCESS_POINT_NAME,
    });

    let accessPntName = accessPoint; 

    if (accessPntName != null) {
      const objectLambdaPnt = new s3objectlambda.CfnAccessPoint(this, 's3ObjectLambdaPnt', {
          objectLambdaConfiguration: {
          supportingAccessPoint: accessPntName,
          transformationConfigurations: [{
            actions: ['GetObject'],
            contentTransformation: {
              'AwsLambda': {
                'FunctionArn':  `${object_lambda_access_fn.functionArn}`,
              }
            }
          }]
        }
      });

    new CfnOutput(this, 'testBucket', { value: databucket });
    new CfnOutput(this, 'object_lambda_access_fnArn', { value: object_lambda_access_fn.functionArn });
    new CfnOutput(this, 'objectLambdaPntArn', { value: objectLambdaPnt.attrArn });
    new CfnOutput(this, 'objectLambdaPntUrl', { 
      value: `https://console.aws.amazon.com/s3/olap/${Aws.ACCOUNT_ID}/${objectLambdaPnt.name}?region=${Aws.REGION}`
    });
    }   
  }
}
