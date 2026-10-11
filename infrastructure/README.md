# AWS pilot deployment

The template is implemented and locally validated with `cfn-lint`. It has **not been deployed in this session**. Local tests do not prove AWS permissions, regional model access, quota availability or service operation.

Resources: API Gateway HTTP API, Python Lambda, DynamoDB on-demand/PITR, private encrypted versioned S3 evidence, Cognito pool/public PKCE client/four groups, Secrets Manager signing secret, IoT topic rule, CloudWatch logs/error alarm, SNS alerts, optional account-wide monthly budget notification, and an Amplify manual-deployment app. Bedrock, Polly and Location are invoked through SDK clients and need no standalone resource in this template.

## Deploy when your AWS account is ready

Install AWS CLI, AWS SAM CLI and Docker. Authenticate an AWS profile with deployment permissions. Confirm the chosen region supports your services and chosen Bedrock model. Default region/model ARN in the template is us-east-1.

```sh
sam build --template-file infrastructure/template.yaml --use-container
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

Use a unique `DomainPrefix`. Supply `AlertEmail` if desired and confirm its SNS subscription. Supply `IotEndpoint` from `aws iot describe-endpoint --endpoint-type iot:Data-ATS`. `BedrockResourceArn` must correspond to the chosen model ID and region. The default policy supports a direct foundation model; inference profiles require additional profile/target model IAM resource entries.

The SAM Makefile packages only runtime dependencies and `app/`. Local `.env`, `data/`, tests and `.venv` are excluded from the deployment artifact. Always inspect the build artifact before uploading.

The first deployment can use `FrontendUrl=https://example.invalid` solely to create the Amplify app. Read the real `FrontendUrl` stack output, then deploy again with that origin as the parameter. The second deployment aligns CORS, public config and Cognito callback URLs. No account can complete browser login until this is correct.

Build the frontend with `VITE_API_BASE_URL=<ApiUrl output>/api`, zip **the contents of frontend/dist**, and upload them to the created Amplify app's `main` branch using Amplify manual deployment. No Git push or repository connection is needed. Use the public frontend origin, never an API URL, for Cognito callbacks.

Create test users in Cognito and assign exactly one of the four groups. Verify email/temporary-password flow. Create real facility records in the app and have an administrator review supplied permit evidence. Production never seeds local demo facilities. Add actual price and factor sources separately.

## Post-deployment acceptance checks

- Sign in each group; verify cross-role denied requests. Confirm callback, token expiry and CORS behavior.
- Upload a fresh image through real Bedrock, including unavailable-model and invalid-image cases. Save evidence to S3; verify private access and denied unrelated-user reads.
- Complete a fresh two-party handover, acknowledged payment, receipt and measured recovery; verify data persists across Lambda cold starts.
- Run the offline reload/reconnect test against deployed HTTPS. Check the service worker precaches hashed JS/CSS on first install.
- Play both languages through Polly; distinguish a device-speech fallback from successful Polly operation.
- Publish a simulated bin reading to IoT; verify rule invocation in CloudWatch and the reading in DynamoDB. Run Location routing and verify `amazon_location_road_matrix` in the response.
- Verify monitoring and cost alerts. The budget is an account-level warning, not a hard spending cap. Concurrency and throttling constrain the API, not every service's cost.

HTTP requests have a short gateway budget. Inference uses a bounded 20-second SDK read and no automatic SDK retry; slow calls fail, and the client retains unsent drafts. A queue/job-polling inference design is future work for larger or slower models.

The DynamoDB implementation is deliberately a small-pilot document store: one partition, strongly consistent paginated reads checked against a revision before/after, and conditional atomic writes. It is unsuitable for high-volume production without indexed access patterns. Financial disputes after material has moved onward are rejected with an instruction to involve an administrator; this pilot does not implement downstream refunds or arbitration.

S3 and DynamoDB have retention policies and survive stack deletion. Deletion of retained resources and backups is a separate explicit operation; no cleanup script silently deletes evidence. Secrets Manager rotation requires coordinating outstanding QR validity. Production credentials belong in IAM roles, not browser env files.

## References used for configuration

- [SAM HttpApi event configuration](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-httpapi.html)
- [Amplify manual deployments](https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html)
- [Amplify CloudFormation app resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-amplify-app.html)
