#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { EnvironmentStack } from '../lib/environment-stack';

const app = new App();
new EnvironmentStack(app, 'EnvironmentStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
