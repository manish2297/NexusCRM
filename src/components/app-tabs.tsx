import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.primary}
      labelStyle={{ selected: { color: colors.text } }}>
      
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="square.grid.2x2.fill"
          md="dashboard"
          src={require('@/assets/images/tabIcons/dashboard.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leads">
        <NativeTabs.Trigger.Label>Leads</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.2.fill"
          md="groups"
          src={require('@/assets/images/tabIcons/leads.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tasks">
        <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="checklist"
          md="task_alt"
          src={require('@/assets/images/tabIcons/tasks.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="gearshape.fill"
          md="settings"
          src={require('@/assets/images/tabIcons/settings.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      
    </NativeTabs>
  );
}

