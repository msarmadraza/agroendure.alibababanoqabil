import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DemoAuthProvider } from '@/services/auth/demoAuthContext';
import { OnboardingProvider } from '@/services/auth/onboardingContext';
import { LanguageProvider } from '@/services/i18n/languageContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <DemoAuthProvider>
          <OnboardingProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: '#1b4332' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="crop-details" options={{ presentation: 'modal' }} />
            <Stack.Screen name="bidding" options={{ presentation: 'modal' }} />
            <Stack.Screen name="contract-preparation" options={{ presentation: 'modal' }} />
            <Stack.Screen name="contract" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="trade/[id]"
              options={{ headerShown: true, title: 'Trade Negotiation' }}
            />
            <Stack.Screen
              name="agreement/[id]"
              options={{ headerShown: true, title: 'Agreement Review' }}
            />
            <Stack.Screen name="verification/cnic" />
            <Stack.Screen name="verification/[id]" />
          </Stack>
        </OnboardingProvider>
      </DemoAuthProvider>
    </LanguageProvider>
  </SafeAreaProvider>
);
}
