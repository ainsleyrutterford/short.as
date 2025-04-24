import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin, S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";

interface WebsiteStackProps extends cdk.StackProps {
  httpApi: apigateway.HttpApi;
  isProd?: boolean;
  hostedZone?: route53.HostedZone;
  certificate?: acm.Certificate;
}

export class WebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);

    const { httpApi, isProd, hostedZone, certificate } = props;
    const { url: httpApiUrl } = httpApi;

    if (!httpApiUrl) throw new Error("HTTP API Gateway does not have a URL");

    const bucket = new s3.Bucket(this, "Bucket");

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, "OriginAccessIdentity");
    bucket.grantRead(originAccessIdentity);

    // Note that we have to explicitly set the id and function name like this due to a bug in
    // CDK where the names will be different on each deployment which breaks snapshot tests:
    // https://github.com/aws/aws-cdk/issues/15523
    const htmlRedirectFunctionName = `HtmlRedirectFunction${this.node.addr}`;
    const htmlRedirectFunction = new cloudfront.Function(this, htmlRedirectFunctionName, {
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.resolve(__dirname, "./cloudfront-functions/html-redirect.js"),
      }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      functionName: htmlRedirectFunctionName,
    });

    const rootRedirectFunctionName = `RootRedirectFunction${this.node.addr}`;
    const rootRedirectFunction = new cloudfront.Function(this, rootRedirectFunctionName, {
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.resolve(__dirname, "./cloudfront-functions/root-redirect.js"),
      }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      functionName: rootRedirectFunctionName,
    });

    const apiRedirectFunctionName = `ApiRedirectFunction${this.node.addr}`;
    const apiRedirectFunction = new cloudfront.Function(this, apiRedirectFunctionName, {
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.resolve(__dirname, "./cloudfront-functions/api-redirect.js"),
      }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      functionName: apiRedirectFunctionName,
    });

    // https://github.com/aws/aws-cdk/issues/1882#issuecomment-518680023
    const httpApiDomainName = cdk.Fn.select(2, cdk.Fn.split("/", httpApiUrl));

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      // We use a different custom domain for prod and dev
      domainNames: isProd ? ["short.as", "www.short.as"] : ["dev.short.as"],
      certificate,
      enableLogging: !isProd,
      // API Gateway origin behavior, when visiting short.as/* it redirects to APIGateway/urls/*
      defaultBehavior: {
        origin: new HttpOrigin(httpApiDomainName, { originPath: "/urls" }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          // If someone visits just the root domain, redirect to the website in the S3 bucket
          { eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: rootRedirectFunction },
        ],
      },
      additionalBehaviors: {
        // S3 origin behavior
        "/create*": {
          origin: S3BucketOrigin.withOriginAccessIdentity(bucket, { originAccessIdentity }),
          // We don't need to worry about serving stale content as the S3 BucketDeployment docs say:
          // "Files in the distribution's edge caches will be invalidated after files are uploaded to the destination bucket."
          // This should also enable compression which helps for Google Lighthouse
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [
            // Allows users to visit just 'domain/hello', rather than 'domain/hello.html'. Also redirects
            // from 'domain/directory/' to 'domain/directory/index.html'
            { eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: htmlRedirectFunction },
          ],
        },
        "/api/*": {
          origin: new HttpOrigin(httpApiDomainName),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          // Include all cookies, and query strings in the requests, and all headers except for the Host
          // header as API Gateway expects the Host header to contain the origin domain name instead of the domain
          // name of the CloudFront distribution
          // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html#managed-origin-request-policy-all-viewer-except-host-header
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [
            // Strips the /api prefix from the request so that it is mapped to the API Gateway routes successfully
            { eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: apiRedirectFunction },
          ],
        },
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/create/404.html",
        },
      ],
    });

    if (hostedZone !== undefined) {
      if (isProd) {
        // Create the HostedZone records for the `short.as` domain to work with the CloudFront distribution
        // This is step 7 of this AWS guide:
        // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html
        new route53.ARecord(this, "ARecordForCloudFront", {
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
          zone: hostedZone,
        });

        // Since the CloudFront distribution has IPv6 enabled:
        // https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html
        new route53.AaaaRecord(this, "AaaaRecordForCloudFront", {
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
          zone: hostedZone,
        });
      } else {
        // Same thing but for dev instead
        new route53.ARecord(this, "DevARecordForCloudFront", {
          recordName: "dev",
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
          zone: hostedZone,
        });

        new route53.AaaaRecord(this, "DevAaaaRecordForCloudFront", {
          recordName: "dev",
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
          zone: hostedZone,
        });
      }
    }

    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: bucket,
      distribution,
      destinationKeyPrefix: "create/",
      sources: [Source.asset(path.resolve(__dirname, "../../site/out"))],
    });
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }
}
