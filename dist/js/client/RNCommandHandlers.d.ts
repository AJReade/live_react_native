/**
 * RNCommandHandlers - Automatic handler for React Native commands sent from the server
 *
 * When the server sends RN.haptic(), RN.navigate(), etc., this class automatically
 * executes the corresponding native React Native functionality.
 */
export declare class RNCommandHandlers {
    private dependencies;
    constructor();
    /**
     * Main handler for RN commands from the server
     */
    handleEvent(eventType: string, payload: any): Promise<void>;
    /**
     * Handle haptic feedback
     */
    private handleHaptic;
    /**
     * Handle navigation
     */
    private handleNavigate;
    /**
     * Handle go back
     */
    private handleGoBack;
    /**
     * Handle reset stack
     */
    private handleResetStack;
    /**
     * Handle replace
     */
    private handleReplace;
    /**
     * Handle vibration
     */
    private handleVibrate;
    /**
     * Handle notifications
     */
    private handleNotification;
    /**
     * Handle badge updates
     */
    private handleBadge;
    /**
     * Handle toast messages
     */
    private handleToast;
    /**
     * Handle alert dialogs
     */
    private handleAlert;
    /**
     * Handle keyboard dismissal
     */
    private handleDismissKeyboard;
    /**
     * Handle show loading
     */
    private handleShowLoading;
    /**
     * Handle hide loading
     */
    private handleHideLoading;
    /**
     * Check which React Native dependencies are available
     */
    checkDependencies(): {
        [key: string]: boolean;
    };
}
//# sourceMappingURL=RNCommandHandlers.d.ts.map