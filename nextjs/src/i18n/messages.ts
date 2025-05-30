import { Locale } from './config';

export async function getMessages(locale: Locale) {
  try {
    const messages = await import(`../../messages/${locale}.json`);
    return messages.default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to English if the requested locale fails
    const fallbackMessages = await import(`../../messages/en.json`);
    return fallbackMessages.default;
  }
} 