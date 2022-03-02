#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { NLBCdkStack } from '../lib/cdk-stack';

const app = new App();
new NLBCdkStack(app, 'NLBCdkStack', {

  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

});