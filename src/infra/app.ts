#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from './main/ApiStack';

const app = new cdk.App();
new ApiStack(app, 'WebScraperApi', {});