# Wild Rydes Setup Notes

## Important Information

This document contains crucial setup information and notes about files that need to be added manually.

## ⚠️ Missing JavaScript Libraries

The following JavaScript libraries are **NOT** included in this repository due to licensing and size considerations. You need to add them before the authentication pages will work.

### Option 1: Use CDN (Recommended - Easiest!)

Replace the script tags in `register.html`, `signin.html`, `verify.html`, and `ride.html` with these CDN links:

```html
<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.1.0.min.js"></script>

<!-- Bootstrap -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>

<!-- AWS Cognito SDK -->
<script src="https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6.3.6/dist/amazon-cognito-identity.min.js"></script>
```

**Current script tags to replace:**
```html
<script src="js/vendor/jquery-3.1.0.js"></script>
<script src="js/vendor/bootstrap.min.js"></script>
<script src="js/vendor/aws-cognito-sdk.min.js"></script>
<script src="js/vendor/amazon-cognito-identity.min.js"></script>
```

### Option 2: Download Libraries Locally

1. Create a `js/vendor/` directory:
   ```bash
   mkdir -p js/vendor
   ```

2. Download the required files:
   - **jQuery 3.1.0**: https://code.jquery.com/jquery-3.1.0.min.js
     - Save as: `js/vendor/jquery-3.1.0.js`
   
   - **Bootstrap 3.3.7**: https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js
     - Save as: `js/vendor/bootstrap.min.js`
   
   - **AWS Cognito SDK**: 
     - Visit: https://github.com/aws-amplify/amplify-js
     - Download the latest `amazon-cognito-identity.min.js`
     - Save as: `js/vendor/amazon-cognito-identity.min.js`

## 📝 Configuration Checklist

Before deploying, make sure you've completed these steps:

### 1. AWS Amplify Setup
- [ ] Forked this repository to your GitHub account
- [ ] Connected GitHub to AWS Amplify
- [ ] Deployed the application
- [ ] Noted your Amplify URL

### 2. Amazon Cognito Configuration
- [ ] Created Cognito User Pool
- [ ] Created App Client
- [ ] Noted User Pool ID
- [ ] Noted App Client ID
- [ ] Updated `js/config.js` with Cognito values

### 3. DynamoDB Setup
- [ ] Created DynamoDB table named `Rides`
- [ ] Set partition key as `RideId` (String)

### 4. IAM Role Setup
- [ ] Created IAM role `WildRydesLambda`
- [ ] Attached `AWSLambdaBasicExecutionRole` policy
- [ ] Created inline policy for DynamoDB write access

### 5. Lambda Function Setup
- [ ] Created Lambda function `RequestUnicorn`
- [ ] Used Node.js 20.x runtime
- [ ] Attached `WildRydesLambda` IAM role
- [ ] Deployed Lambda code
- [ ] Tested Lambda function successfully

### 6. API Gateway Setup
- [ ] Created REST API `WildRydes`
- [ ] Created Cognito authorizer
- [ ] Created `/ride` resource
- [ ] Created POST method
- [ ] Enabled Lambda Proxy Integration
- [ ] Enabled CORS
- [ ] Configured method authorization
- [ ] Deployed API to `prod` stage
- [ ] Noted Invoke URL
- [ ] Updated `js/config.js` with API invoke URL

### 7. Final Steps
- [ ] Committed all changes to GitHub
- [ ] Waited for Amplify automatic deployment
- [ ] Tested user registration
- [ ] Tested email verification
- [ ] Tested user sign-in
- [ ] Tested ride request on map

## 🔧 Quick Configuration Template

Use this template to fill in your `js/config.js`:

```javascript
window._config = {
    cognito: {
        userPoolId: 'us-east-1_XXXXXXXXX',        // Replace with your User Pool ID
        userPoolClientId: 'XXXXXXXXXXXXXXXXXX',    // Replace with your App Client ID
        region: 'us-east-1'                        // Replace with your AWS region
    },
    api: {
        invokeUrl: 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod'  // Replace with your API Gateway URL
    }
};
```

## 🐛 Common Issues and Solutions

### Issue: "noCognitoMessage" appears on ride.html
**Solution**: Make sure `js/config.js` has valid Cognito User Pool ID and Client ID.

### Issue: "noApiMessage" appears on ride.html
**Solution**: Make sure `js/config.js` has valid API Gateway invoke URL.

### Issue: Can't register users
**Solution**: 
1. Check Cognito User Pool is created correctly
2. Verify email attribute is configured
3. Check `config.js` values are correct
4. Ensure JavaScript libraries are loaded (check browser console)

### Issue: Registration works but can't sign in
**Solution**: 
1. Make sure you verified your email address
2. Check Cognito User Pool has the user
3. Verify App Client ID is correct in `config.js`

### Issue: Can sign in but can't request rides
**Solutions**:
1. Check API Gateway invoke URL in `config.js`
2. Verify API Gateway has CORS enabled
3. Check Lambda function has correct permissions
4. Test Lambda function independently
5. Check authorizer is configured on POST method

### Issue: Rides not saving to DynamoDB
**Solution**:
1. Verify DynamoDB table name is exactly `Rides` (case-sensitive)
2. Check Lambda IAM role has DynamoDB write permissions
3. View Lambda function logs in CloudWatch

### Issue: Map doesn't appear
**Solution**: 
1. Check browser console for errors
2. Verify ArcGIS API is loading (check network tab)
3. Make sure you're signed in

## 🎯 Testing Checklist

After deployment, test these features:

1. **Landing Page** (`/index.html`)
   - [ ] Page loads without errors
   - [ ] All navigation links work
   - [ ] Sign In button redirects correctly

2. **Registration** (`/register.html`)
   - [ ] Can enter email and password
   - [ ] Password confirmation works
   - [ ] Receives verification email
   - [ ] Redirects to verify page

3. **Email Verification** (`/verify.html`)
   - [ ] Can enter email and code
   - [ ] Successful verification
   - [ ] Redirects to sign in

4. **Sign In** (`/signin.html`)
   - [ ] Can sign in with verified account
   - [ ] Redirects to ride page
   - [ ] Invalid credentials show error

5. **Ride Request** (`/ride.html`)
   - [ ] Map loads successfully
   - [ ] Can click on map to set pickup location
   - [ ] Request button becomes enabled
   - [ ] Clicking request dispatches unicorn
   - [ ] Success message appears
   - [ ] Sign out button works

6. **Database** (DynamoDB Console)
   - [ ] Ride record appears in Rides table
   - [ ] Record has correct structure
   - [ ] User email is stored correctly

## 📊 Expected AWS Costs

Based on typical usage during learning/testing:

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| AWS Amplify | 1,000 build minutes, 15 GB served | $0 |
| Amazon Cognito | 50,000 MAUs | $0 |
| AWS Lambda | 1M requests, 400K GB-sec | $0 |
| DynamoDB | 25 GB, 25 RCU, 25 WCU | $0 |
| API Gateway | 1M calls (first 12 months) | $0 |
| **Total** | | **$0 - $1/month** |

**Note**: Costs may apply if you exceed free tier limits or after the first 12 months.

## 🗑️ Resource Cleanup

When you're done with the project, delete resources in this order to avoid orphaned resources:

1. **AWS Amplify** - Delete the app
2. **API Gateway** - Delete the API
3. **AWS Lambda** - Delete the function
4. **Amazon Cognito** - Delete the user pool
5. **Amazon DynamoDB** - Delete the Rides table
6. **IAM** - Delete the WildRydesLambda role

## 💡 Tips for Success

1. **Take notes**: Write down all IDs and URLs as you create resources
2. **Use same region**: Keep all resources in the same AWS region (e.g., us-east-1)
3. **Check browser console**: When debugging, always check the browser's developer console
4. **Test incrementally**: Test each module before moving to the next
5. **Read error messages**: Error messages usually tell you exactly what's wrong
6. **Use CloudWatch**: Check Lambda logs in CloudWatch when debugging backend issues

## 📚 Additional Learning Resources

- [AWS Serverless Workshops](https://aws.amazon.com/serverless-workshops/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## 🎓 Next Steps

After completing this project, consider:

1. **Extend the application**:
   - Add ride history page
   - Implement ride cancellation
   - Add user profile page
   - Create admin dashboard

2. **Enhance security**:
   - Add MFA (Multi-Factor Authentication)
   - Implement rate limiting
   - Add input validation

3. **Improve architecture**:
   - Add CloudFront CDN
   - Implement API caching
   - Add monitoring with CloudWatch

4. **Build related projects**:
   - Create mobile app with AWS Amplify
   - Add real-time features with AppSync
   - Implement notifications with SNS

## 🆘 Getting Help

If you encounter issues:

1. Check this document first
2. Review the README.md
3. Check AWS service documentation
4. Search for error messages online
5. Check AWS forums and Stack Overflow

## ✅ Final Verification

Before considering the project complete:

- [ ] All pages load without console errors
- [ ] User can register, verify, and sign in
- [ ] Rides can be requested and are saved to DynamoDB
- [ ] All AWS resources are properly configured
- [ ] Configuration files are updated with correct values
- [ ] Application is fully functional end-to-end

**Congratulations! You've built a production-ready serverless web application! 🎉**
