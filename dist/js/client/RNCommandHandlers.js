"use strict";
/**
 * RNCommandHandlers - Automatic handler for React Native commands sent from the server
 *
 * When the server sends RN.haptic(), RN.navigate(), etc., this class automatically
 * executes the corresponding native React Native functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RNCommandHandlers = void 0;
class RNCommandHandlers {
    constructor() {
        this.dependencies = {};
        this.checkDependencies();
    }
    /**
     * Main handler for RN commands from the server
     */
    async handleEvent(eventType, payload) {
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
        }
        catch (error) {
            console.error('RN Command Handler Error:', error);
            // Don't throw - continue execution
        }
    }
    /**
     * Handle haptic feedback
     */
    async handleHaptic(payload) {
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
        }
        catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    }
    /**
     * Handle navigation
     */
    async handleNavigate(payload) {
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
        }
        catch (error) {
            console.warn('Navigation failed:', error);
        }
    }
    /**
     * Handle go back
     */
    async handleGoBack(payload) {
        if (!this.dependencies['@react-navigation/native']) {
            console.warn('React Navigation not available');
            return;
        }
        try {
            const { useNavigation } = require('@react-navigation/native');
            const navigation = useNavigation();
            navigation.goBack();
        }
        catch (error) {
            console.warn('Go back failed:', error);
        }
    }
    /**
     * Handle reset stack
     */
    async handleResetStack(payload) {
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
        }
        catch (error) {
            console.warn('Reset stack failed:', error);
        }
    }
    /**
     * Handle replace
     */
    async handleReplace(payload) {
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
        }
        catch (error) {
            console.warn('Replace failed:', error);
        }
    }
    /**
     * Handle vibration
     */
    async handleVibrate(payload) {
        if (!this.dependencies['react-native']) {
            console.warn('React Native Vibration not available');
            return;
        }
        try {
            const { Vibration } = require('react-native');
            const { duration = 400, pattern } = payload || {};
            if (pattern && Array.isArray(pattern)) {
                Vibration.vibrate(pattern);
            }
            else {
                Vibration.vibrate(duration);
            }
        }
        catch (error) {
            console.warn('Vibration failed:', error);
        }
    }
    /**
     * Handle notifications
     */
    async handleNotification(payload) {
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
        }
        catch (error) {
            console.warn('Notification failed:', error);
        }
    }
    /**
     * Handle badge updates
     */
    async handleBadge(payload) {
        // TODO: Implement with expo-notifications setBadgeCountAsync
        // For now, just log the badge update
        try {
            const { count } = payload || {};
            console.log(`Badge count update: ${count}`);
            // Future implementation:
            // const Notifications = require('expo-notifications');
            // await Notifications.setBadgeCountAsync(count || 0);
        }
        catch (error) {
            console.warn('Badge update failed:', error);
        }
    }
    /**
     * Handle toast messages
     */
    async handleToast(payload) {
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
            }
            else {
                // iOS fallback to alert
                Alert.alert('', message || '');
            }
        }
        catch (error) {
            console.warn('Toast failed:', error);
        }
    }
    /**
     * Handle alert dialogs
     */
    async handleAlert(payload) {
        if (!this.dependencies['react-native']) {
            console.warn('React Native Alert not available');
            return;
        }
        try {
            const { Alert } = require('react-native');
            const { title, message, buttons } = payload || {};
            Alert.alert(title || '', message || '', buttons);
        }
        catch (error) {
            console.warn('Alert failed:', error);
        }
    }
    /**
     * Handle keyboard dismissal
     */
    async handleDismissKeyboard(payload) {
        if (!this.dependencies['react-native']) {
            console.warn('React Native Keyboard not available');
            return;
        }
        try {
            const { Keyboard } = require('react-native');
            Keyboard.dismiss();
        }
        catch (error) {
            console.warn('Keyboard dismiss failed:', error);
        }
    }
    /**
     * Handle show loading
     */
    async handleShowLoading(payload) {
        try {
            const { message } = payload || {};
            console.log(`Show loading: ${message || 'Loading...'}`);
            // TODO: Integrate with a loading library like react-native-loading-spinner-overlay
            // or a custom loading context
        }
        catch (error) {
            console.warn('Show loading failed:', error);
        }
    }
    /**
     * Handle hide loading
     */
    async handleHideLoading(payload) {
        try {
            console.log('Hide loading');
            // TODO: Integrate with a loading library
        }
        catch (error) {
            console.warn('Hide loading failed:', error);
        }
    }
    /**
     * Check which React Native dependencies are available
     * Note: This is a simplified check for Metro bundler compatibility
     */
    checkDependencies() {
        // For Metro bundler compatibility, we assume dependencies are available
        // In a real React Native environment with these packages installed
        this.dependencies['react-native'] = true; // Will be available in RN environment
        this.dependencies['expo-haptics'] = true; // Assume available in Expo environment
        this.dependencies['@react-navigation/native'] = true; // Assume available if included
        this.dependencies['expo-notifications'] = true; // Assume available in Expo environment
        return { ...this.dependencies };
    }
}
exports.RNCommandHandlers = RNCommandHandlers;
