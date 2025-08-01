/**
 * RNCommandHandlers - Automatic handler for React Native commands sent from the server
 *
 * When the server sends RN.haptic(), RN.navigate(), etc., this class automatically
 * executes the corresponding native React Native functionality.
 */

export class RNCommandHandlers {
  private dependencies: { [key: string]: boolean } = {};

  constructor() {
    this.checkDependencies();
  }

  /**
   * Main handler for RN commands from the server
   */
  async handleEvent(eventType: string, payload: any): Promise<void> {
    try {
      if (!eventType.startsWith('rn:')) {
        return; // Not an RN command
      }

      const command = eventType.replace('rn:', '');

      switch (command) {
        case 'haptic':
          await this.handleHaptic(payload);
          break;
        case 'navigate':
          await this.handleNavigate(payload);
          break;
        case 'go_back':
          await this.handleGoBack(payload);
          break;
        case 'reset_stack':
          await this.handleResetStack(payload);
          break;
        case 'replace':
          await this.handleReplace(payload);
          break;
        case 'vibrate':
          await this.handleVibrate(payload);
          break;
        case 'notification':
          await this.handleNotification(payload);
          break;
        case 'badge':
          await this.handleBadge(payload);
          break;
        case 'toast':
          await this.handleToast(payload);
          break;
        case 'alert':
          await this.handleAlert(payload);
          break;
        case 'dismiss_keyboard':
          await this.handleDismissKeyboard(payload);
          break;
        case 'show_loading':
          await this.handleShowLoading(payload);
          break;
        case 'hide_loading':
          await this.handleHideLoading(payload);
          break;
        default:
          console.warn(`Unknown RN command: ${command}`);
      }
    } catch (error) {
      console.error('RN Command Handler Error:', error);
      // Don't throw - continue execution
    }
  }

  /**
   * Handle haptic feedback
   */
  private async handleHaptic(payload: any): Promise<void> {
    if (!this.dependencies['expo-haptics']) {
      console.warn('expo-haptics not available');
      return;
    }

    try {
      const Haptics = require('expo-haptics');
      const { type } = payload || {};

      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        default:
          // Default to light impact
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Handle navigation
   */
  private async handleNavigate(payload: any): Promise<void> {
    if (!this.dependencies['@react-navigation/native']) {
      console.warn('React Navigation not available');
      return;
    }

    try {
      const { useNavigation } = require('@react-navigation/native');
      const navigation = useNavigation();
      const { screen, params } = payload || {};

      if (screen) {
        navigation.navigate(screen, params);
      }
    } catch (error) {
      console.warn('Navigation failed:', error);
    }
  }

  /**
   * Handle go back
   */
  private async handleGoBack(payload: any): Promise<void> {
    if (!this.dependencies['@react-navigation/native']) {
      console.warn('React Navigation not available');
      return;
    }

    try {
      const { useNavigation } = require('@react-navigation/native');
      const navigation = useNavigation();
      navigation.goBack();
    } catch (error) {
      console.warn('Go back failed:', error);
    }
  }

  /**
   * Handle reset stack
   */
  private async handleResetStack(payload: any): Promise<void> {
    if (!this.dependencies['@react-navigation/native']) {
      console.warn('React Navigation not available');
      return;
    }

    try {
      const { useNavigation } = require('@react-navigation/native');
      const navigation = useNavigation();
      const { routes } = payload || {};

      if (routes && routes.length > 0) {
        navigation.reset({
          index: 0,
          routes: routes,
        });
      }
    } catch (error) {
      console.warn('Reset stack failed:', error);
    }
  }

  /**
   * Handle replace
   */
  private async handleReplace(payload: any): Promise<void> {
    if (!this.dependencies['@react-navigation/native']) {
      console.warn('React Navigation not available');
      return;
    }

    try {
      const { useNavigation } = require('@react-navigation/native');
      const navigation = useNavigation();
      const { screen, params } = payload || {};

      if (screen) {
        navigation.replace(screen, params);
      }
    } catch (error) {
      console.warn('Replace failed:', error);
    }
  }

  /**
   * Handle vibration
   */
  private async handleVibrate(payload: any): Promise<void> {
    if (!this.dependencies['react-native']) {
      console.warn('React Native Vibration not available');
      return;
    }

    try {
      const { Vibration } = require('react-native');
      const { duration = 400, pattern } = payload || {};

      if (pattern && Array.isArray(pattern)) {
        Vibration.vibrate(pattern);
      } else {
        Vibration.vibrate(duration);
      }
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Handle notifications
   */
  private async handleNotification(payload: any): Promise<void> {
    if (!this.dependencies['expo-notifications']) {
      console.warn('expo-notifications not available');
      return;
    }

    try {
      const Notifications = require('expo-notifications');
      const { title, body, data, trigger } = payload || {};

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || '',
          body: body || '',
          data: data,
        },
        trigger: trigger || null, // null = immediate
      });
    } catch (error) {
      console.warn('Notification failed:', error);
    }
  }

  /**
   * Handle badge updates
   */
  private async handleBadge(payload: any): Promise<void> {
    // TODO: Implement with expo-notifications setBadgeCountAsync
    // For now, just log the badge update
    try {
      const { count } = payload || {};
      console.log(`Badge count update: ${count}`);

      // Future implementation:
      // const Notifications = require('expo-notifications');
      // await Notifications.setBadgeCountAsync(count || 0);
    } catch (error) {
      console.warn('Badge update failed:', error);
    }
  }

  /**
   * Handle toast messages
   */
  private async handleToast(payload: any): Promise<void> {
    if (!this.dependencies['react-native']) {
      console.warn('React Native not available for toast');
      return;
    }

    try {
      const { ToastAndroid, Alert, Platform } = require('react-native');
      const { message, duration = 'short' } = payload || {};

      if (Platform.OS === 'android') {
        const toastDuration = duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT;
        ToastAndroid.show(message || '', toastDuration);
      } else {
        // iOS fallback to alert
        Alert.alert('', message || '');
      }
    } catch (error) {
      console.warn('Toast failed:', error);
    }
  }

  /**
   * Handle alert dialogs
   */
  private async handleAlert(payload: any): Promise<void> {
    if (!this.dependencies['react-native']) {
      console.warn('React Native Alert not available');
      return;
    }

    try {
      const { Alert } = require('react-native');
      const { title, message, buttons } = payload || {};

      Alert.alert(title || '', message || '', buttons);
    } catch (error) {
      console.warn('Alert failed:', error);
    }
  }

  /**
   * Handle keyboard dismissal
   */
  private async handleDismissKeyboard(payload: any): Promise<void> {
    if (!this.dependencies['react-native']) {
      console.warn('React Native Keyboard not available');
      return;
    }

    try {
      const { Keyboard } = require('react-native');
      Keyboard.dismiss();
    } catch (error) {
      console.warn('Keyboard dismiss failed:', error);
    }
  }

  /**
   * Handle show loading
   */
  private async handleShowLoading(payload: any): Promise<void> {
    try {
      const { message } = payload || {};
      console.log(`Show loading: ${message || 'Loading...'}`);

      // TODO: Integrate with a loading library like react-native-loading-spinner-overlay
      // or a custom loading context
    } catch (error) {
      console.warn('Show loading failed:', error);
    }
  }

  /**
   * Handle hide loading
   */
  private async handleHideLoading(payload: any): Promise<void> {
    try {
      console.log('Hide loading');

      // TODO: Integrate with a loading library
    } catch (error) {
      console.warn('Hide loading failed:', error);
    }
  }

  /**
   * Check which React Native dependencies are available
   */
  checkDependencies(): { [key: string]: boolean } {
    const deps = [
      'react-native',
      'expo-haptics',
      '@react-navigation/native',
      'expo-notifications',
    ];

    for (const dep of deps) {
      try {
        require(dep);
        this.dependencies[dep] = true;
      } catch (error) {
        this.dependencies[dep] = false;
      }
    }

    return { ...this.dependencies };
  }
}