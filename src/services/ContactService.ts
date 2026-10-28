import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

export interface DeviceContactItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export const ContactService = {
  /**
   * Request device contacts permission and return structured contacts list
   */
  async getDeviceContacts(): Promise<{ success: boolean; contacts: DeviceContactItem[]; error?: string }> {
    if (Platform.OS === 'web') {
      return {
        success: false,
        contacts: [],
        error: 'Phone address book is only available on native Android and iOS devices.',
      };
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          contacts: [],
          error: 'Contacts permission was denied. Please grant permission in device Settings.',
        };
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const formatted = data
        .filter(c => c.name && c.name.trim().length > 0)
        .map(c => ({
          id: c.id || `contact-${Math.random()}`,
          name: c.name || '',
          email: c.emails && c.emails[0]?.email ? c.emails[0].email : '',
          phone: c.phoneNumbers && c.phoneNumbers[0]?.number ? c.phoneNumbers[0].number : '',
          company: c.company || '',
        }));

      return {
        success: true,
        contacts: formatted,
      };
    } catch (err: any) {
      console.warn('[ContactService] Error accessing device contacts:', err);
      return {
        success: false,
        contacts: [],
        error: err?.message || 'Unable to load contacts.',
      };
    }
  },
};
