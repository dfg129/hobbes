#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EventbridgeStack } from '../lib/eventbridge-stack';

const app = new cdk.App();
new EventbridgeStack(app, 'EventbridgeStack', {
   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});