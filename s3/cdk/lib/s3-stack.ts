import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';


export class S3Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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

    parameter.grantRead(split_file_fn);
    dataBucket.grantRead(split_file_fn);
    
    dataBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(split_file_fn), {prefix: '*'});
 }
}
