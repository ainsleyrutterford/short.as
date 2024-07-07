import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DomainStackProps extends cdk.StackProps {}

/**
 * This stack creates:
 * - the Route53 HostedZone that will act as the DNS service for the short.as domain
 * - the SSL/TLS certificate for the domain
 * - the SSL/TLS certificate for the dev domain
 *
 * This should only be deployed to prod, and should only be deployed to the `us-east-1` region
 * since ACM certificates that are used with CloudFront must be in the `us-east-1` region.
 *
 * Documentation about using Route53 as the DNS service for a domain:
 * https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/migrate-dns-domain-inactive.html
 *
 * Documentation about accessing an ACM certificate cross stack/region:
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_certificatemanager-readme.html#cross-region-certificates
 */
export class DomainStack extends cdk.Stack {
  public hostedZone: route53.HostedZone;

  public certificate: acm.Certificate;
  public devCertificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: DomainStackProps) {
    super(scope, id, props);

    // The name servers of this HostedZone are then manually copy/pasted into the short.as domain management
    // panel on the nic.as website
    this.hostedZone = new route53.HostedZone(this, "HostedZone", { zoneName: "short.as" });

    // Redirect www to the apex
    new route53.CnameRecord(this, "WwwCnameRecord", {
      recordName: "www",
      zone: this.hostedZone,
      domainName: this.hostedZone.zoneName,
    });

    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: "short.as",
      subjectAlternativeNames: ["www.short.as"],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });

    this.devCertificate = new acm.Certificate(this, "DevCertificate", {
      domainName: "dev.short.as",
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
