#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3ObjLambdaStack } from '../lib/s3-stack';

const app = new cdk.App();
new S3ObjLambdaStack(app, 'S3ObjLambdaStack', {
   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});