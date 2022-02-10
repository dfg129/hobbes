import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export class LambdaWriteToTableStackStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let docker_dir = path.join(__dirname, './../..');

    
    let write_fn = new lambda.DockerImageFunction(this, 'dynamodb-write-table', {
      description: 'Write to table',
      code: lambda.DockerImageCode.fromImageAsset(docker_dir),
      architecture: lambda.Architecture.ARM_64,
      environment: { 
        RUST_BACKTRACE: '1',
      },
      logRetention: RetentionDays.ONE_DAY,
    });

    const dynamodb_write_policy = new PolicyStatement({
      actions: [
        "dynamodb:PutItem",
        "dynamodb:BatchWrite*",
      ],
      resources: ["*"]
    });
    
    write_fn.role?.attachInlinePolicy(
      new Policy(this, 'dynamodb-write-policy', {
        statements: [dynamodb_write_policy],
      }),
    );
  }
}
