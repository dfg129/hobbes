import { RemovalPolicy, Stack, StackProps, CfnOutput, Aws} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';

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

    const bus = new events.EventBus(this, 'hobbes-events', {
      
    });

    let parameter = new ssm.StringParameter(this, 'DatafilesBucket', {
      allowedPattern:'.*',
      description: 'Datafiles bucket name',
      parameterName: 'DatafilesBucket',
      tier: ssm.ParameterTier.ADVANCED,
      stringValue: dataBucket.bucketName,
    });
    
    let bus_parameter = new ssm.StringParameter(this, 'HobbesEventBus', {
      allowedPattern:'.*',
      description: 'Custom hobbes event bus name',
      parameterName: 'HobbesEventBus',
      tier: ssm.ParameterTier.ADVANCED,
      stringValue: bus.eventBusName,
    });

    
    dataBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AccountPrincipal(this.account)],
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
      ],
      resources: [`${dataBucket.bucketArn}/*`],
    }));
    
    let docker_dir = path.join(__dirname, '../../lambda_datafile_event');

    let post_upload_event_fn = new lambda.DockerImageFunction(this, 'LambdaDatafileEvent', {
      code: lambda.DockerImageCode.fromImageAsset(docker_dir),
      description: 'Post an upload event to eventbus',
      architecture: lambda.Architecture.ARM_64,
      environment: {
        RUST_BACKTRACE: '1',
        DATAFILE_BUCKET_NAME: dataBucket.bucketName,
      },
      logRetention: RetentionDays.ONE_DAY,
    });

    

    bus.grantPutEventsTo(post_upload_event_fn);
    bus_parameter.grantRead(post_upload_event_fn);
    parameter.grantRead(post_upload_event_fn);
    dataBucket.grantRead(post_upload_event_fn);

    dataBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3n.LambdaDestination(post_upload_event_fn));

    new CfnOutput(this, 'testBucketArn', { value: dataBucket.bucketArn });
    new CfnOutput(this, 'split_file_fnArn', { value: post_upload_event_fn.functionArn });
  }
}
