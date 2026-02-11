# 🚀 Quick Deployment Guide

This guide will help you deploy Wild Rydes in under 30 minutes!

## ⚡ Prerequisites Checklist

Before starting, make sure you have:

- [ ] AWS Account with billing enabled
- [ ] GitHub account
- [ ] Text editor (VS Code recommended)
- [ ] Web browser

## 📝 Step-by-Step Deployment

### Step 1: Fork and Clone (5 minutes)

1. Fork this repository to your GitHub account
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/wildrydes-site.git
   cd wildrydes-site
   ```

### Step 2: Deploy to AWS Amplify (5 minutes)

1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** and authorize
4. Choose your `wildrydes-site` repository
5. Click **"Save and deploy"**
6. Wait for deployment (2-3 minutes)
7. **Copy your Amplify URL** (looks like: `https://main.d123456.amplifyapp.com`)

✅ **Checkpoint**: Visit your Amplify URL - you should see the Wild Rydes homepage!

### Step 3: Create Cognito User Pool (5 minutes)

1. Open [Amazon Cognito Console](https://console.aws.amazon.com/cognito/)
2. Click **"Create user pool"**
3. **Configure sign-in experience**:
   - Choose "Email" as sign-in option
   - Click "Next"
4. **Configure security requirements**:
   - Keep defaults
   - Click "Next"
5. **Configure sign-up experience**:
   - Keep defaults
   - Click "Next"
6. **Configure message delivery**:
   - Choose "Send email with Cognito"
   - Click "Next"
7. **Integrate your app**:
   - User pool name: `WildRydes`
   - App client name: `WildRydesWebApp`
   - **Important**: Don't use a client secret
   - Click "Next"
8. Review and **"Create user pool"**

9. **Copy these values** (you'll need them!):
   - User Pool ID (e.g., `us-east-1_abc123`)
   - App Client ID (e.g., `1a2b3c4d5e6f7g8h9i0j`)

✅ **Checkpoint**: You should have a User Pool with an App Client

### Step 4: Update Configuration (3 minutes)

1. Edit `js/config.js` in your local repository:

```javascript
window._config = {
    cognito: {
        userPoolId: 'us-east-1_abc123',      // ← Replace with YOUR User Pool ID
        userPoolClientId: '1a2b3c4d5e...',   // ← Replace with YOUR App Client ID
        region: 'us-east-1'                   // ← Your AWS region
    },
    api: {
        invokeUrl: ''  // Leave empty for now
    }
};
```

2. Commit and push:
```bash
git add js/config.js
git commit -m "Add Cognito configuration"
git push
```

3. Wait 1-2 minutes for Amplify to redeploy

✅ **Checkpoint**: 
- Visit your site
- Click "Sign In" → "Register"
- You should see the registration form
- Try registering with your email

### Step 5: Create DynamoDB Table (3 minutes)

1. Open [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Click **"Create table"**
3. Settings:
   - Table name: `Rides`
   - Partition key: `RideId` (String)
   - Keep all other defaults
4. Click **"Create table"**
5. Wait for table to become "Active" (30 seconds)

✅ **Checkpoint**: You should see a table named "Rides" with status "Active"

### Step 6: Create Lambda Execution Role (5 minutes)

1. Open [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Roles"** → **"Create role"**
3. **Select trusted entity**:
   - Choose "AWS service"
   - Use case: "Lambda"
   - Click "Next"
4. **Add permissions**:
   - Search for `AWSLambdaBasicExecutionRole`
   - Select it
   - Click "Next"
5. **Name and create**:
   - Role name: `WildRydesLambda`
   - Click "Create role"

6. **Add DynamoDB permissions**:
   - Find your new role and click on it
   - Click "Add permissions" → "Create inline policy"
   - Click "JSON" tab
   - Paste this (replace REGION and ACCOUNT_ID):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Rides"
        }
    ]
}
```

   - To find your ACCOUNT_ID: Click on your username in top-right corner
   - To find REGION: Look at your URL (e.g., `us-east-1`)
   - Click "Review policy"
   - Name: `DynamoDBWriteAccess`
   - Click "Create policy"

✅ **Checkpoint**: Role `WildRydesLambda` exists with two policies attached

### Step 7: Create Lambda Function (5 minutes)

1. Open [Lambda Console](https://console.aws.amazon.com/lambda/)
2. Click **"Create function"**
3. Settings:
   - Choose "Author from scratch"
   - Function name: `RequestUnicorn`
   - Runtime: **Node.js 20.x** (or latest)
   - Architecture: x86_64
4. **Change default execution role**:
   - Choose "Use an existing role"
   - Select `WildRydesLambda`
5. Click **"Create function"**

6. **Add function code**:
   - Copy all code from `lambda/RequestUnicorn.js` in this repository
   - Paste into the code editor in Lambda console
   - Click **"Deploy"**

7. **Test the function** (optional but recommended):
   - Click "Test" tab
   - Create new test event named "TestRequestEvent"
   - Use this JSON:

```json
{
    "requestContext": {
        "authorizer": {
            "claims": {
                "cognito:username": "test-user"
            }
        }
    },
    "body": "{\"PickupLocation\":{\"Latitude\":47.6174755835663,\"Longitude\":-122.28837066650185}}"
}
```

   - Click "Test"
   - You should see success with a 201 status code

✅ **Checkpoint**: Lambda function deploys successfully and test passes

### Step 8: Create API Gateway (7 minutes)

1. Open [API Gateway Console](https://console.aws.amazon.com/apigateway/)
2. Click **"Create API"**
3. Choose **"REST API"** (not Private or HTTP API)
4. Click **"Build"**
5. Settings:
   - Choose "New API"
   - API name: `WildRydes`
   - Endpoint Type: "Regional"
6. Click **"Create API"**

#### Create Authorizer

1. In left sidebar, click **"Authorizers"**
2. Click **"Create New Authorizer"**
3. Settings:
   - Name: `WildRydes`
   - Type: "Cognito"
   - Cognito User Pool: Select your `WildRydes` pool
   - Token Source: `Authorization`
4. Click **"Create"**

#### Create Resource and Method

1. In left sidebar, click **"Resources"**
2. Click **"Actions"** → **"Create Resource"**
3. Settings:
   - Resource Name: `ride`
   - Resource Path: `ride`
   - Enable CORS: ✓ Check this box
4. Click **"Create Resource"**

5. With `/ride` selected, click **"Actions"** → **"Create Method"**
6. Choose **POST** from dropdown
7. Click the checkmark
8. Settings:
   - Integration type: "Lambda Function"
   - Use Lambda Proxy integration: ✓ Check this box
   - Lambda Function: `RequestUnicorn`
   - Click "Save"
   - Click "OK" to give API Gateway permission

9. Click **"Method Request"**
10. Under Authorization, click the pencil icon
11. Choose your `WildRydes` authorizer
12. Click the checkmark

#### Enable CORS

1. Select `/ride` resource
2. Click **"Actions"** → **"Enable CORS"**
3. Click **"Enable CORS and replace existing CORS headers"**
4. Click **"Yes, replace existing values"**

#### Deploy API

1. Click **"Actions"** → **"Deploy API"**
2. Deployment stage: **[New Stage]**
3. Stage name: `prod`
4. Click **"Deploy"**

5. **Copy your Invoke URL** at the top (looks like: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod`)

✅ **Checkpoint**: You should see your API deployed with a prod stage URL

### Step 9: Final Configuration (2 minutes)

1. Edit `js/config.js` again:

```javascript
window._config = {
    cognito: {
        userPoolId: 'us-east-1_abc123',      // Your User Pool ID
        userPoolClientId: '1a2b3c4d5e...',   // Your App Client ID
        region: 'us-east-1'
    },
    api: {
        invokeUrl: 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod'  // ← Add your Invoke URL
    }
};
```

2. Commit and push:
```bash
git add js/config.js
git commit -m "Add API Gateway URL"
git push
```

3. Wait 1-2 minutes for Amplify to redeploy

✅ **Checkpoint**: Configuration complete!

## 🎉 Test Your Application!

### Test Registration and Sign-In

1. Go to your Amplify URL
2. Click **"Sign In"** → **"Register"**
3. Enter your email and a password
4. Check your email for verification code
5. Enter the code on the verify page
6. Sign in with your credentials

### Test Ride Request

1. After signing in, you'll see the map
2. Click anywhere on the map
3. A pin will appear
4. Click **"Request Unicorn"**
5. Watch the unicorn arrive! 🦄

### Verify in DynamoDB

1. Go to DynamoDB Console
2. Click on `Rides` table
3. Click "Explore table items"
4. You should see your ride record!

## 🎊 Success!

Congratulations! You've deployed a fully functional serverless web application! 

## 🔍 Troubleshooting

### Problem: Can't register users
**Solution**: 
- Check Cognito User Pool ID and Client ID in `js/config.js`
- Make sure you're using CDN links (or have downloaded the libraries)
- Check browser console for errors

### Problem: Can sign in but can't request rides
**Solution**:
- Verify API Gateway Invoke URL in `js/config.js`
- Check that CORS is enabled
- Verify Lambda has correct IAM permissions
- Test Lambda function independently

### Problem: Rides aren't saved to DynamoDB
**Solution**:
- Check DynamoDB table name is exactly `Rides`
- Verify Lambda IAM role has DynamoDB permissions
- Check Lambda logs in CloudWatch

## 📊 What You've Built

- ✅ Static website hosted on AWS Amplify
- ✅ User authentication with Cognito
- ✅ Serverless API with API Gateway
- ✅ Backend logic with Lambda
- ✅ Data persistence with DynamoDB
- ✅ Secure, scalable architecture
- ✅ All for less than $1/month!

## 🚀 Next Steps

- Add ride history page
- Implement ride cancellation
- Create admin dashboard
- Add real-time notifications
- Build a mobile app

## 🗑️ Clean Up

When you're done, delete resources in this order to avoid charges:

1. Amplify app
2. API Gateway
3. Lambda function
4. Cognito User Pool
5. DynamoDB table
6. IAM role

---

**Need help?** Check `SETUP_NOTES.md` for detailed troubleshooting or open an issue on GitHub!

**Happy Building! 🦄✨**
