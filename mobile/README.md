# IBA Events Hub: mobile app (Team 08, Sprint 1)

React Native with Expo (JavaScript). Built from the Sprint 1 Master Document, Sections 5.1, 6 and 7.

## Run it

```
npm install
cp .env.example .env      # then edit the values
npx expo start            # scan the QR code with Expo Go
```

Use `npx expo start --tunnel` if campus Wi-Fi blocks the phone from reaching the laptop.

## Environment (`.env`, never committed)

| Variable | Meaning |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL, e.g. `https://our-api.onrender.com/api/v1` |
| `EXPO_PUBLIC_USE_MOCKS` | `true` uses sample data from `src/api/mock/`. Must be `false` at submission. |

To switch one area to the real API while the rest stays on mocks, set its entry in
`MOCK_OVERRIDES` in `src/config.js` to `false`.

## Mock accounts

Password for all: `Test@1234`. See the comment at the top of `src/api/mock/mockAuth.js`
for the full list and the error-state accounts. Verify code: `123456`.

## Structure

```
src/
  api/          client.js (axios), auth.js, ApiError.js, tokenStorage.js, mock/
  context/      AuthContext.js
  navigation/   RootNavigator, AuthStack, StudentTabs, OrganiserTabs, ApproverTabs, AdminTabs, MultiRoleTabs
  screens/      auth, student, organiser, approver, admin
  components/   FormField, ErrorBanner, LoadingView, AuthLayout, PlaceholderScreen
  utils/        dates.js (Pakistan time), validators.js
  theme/        theme.js
```
