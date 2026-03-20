declare const en: {
    demoIcon: {
        description: string;
        useCase: {
            icons: {
                name: string;
                description: string;
            };
            size: {
                name: string;
                description: string;
            };
            color: {
                name: string;
                description: string;
            };
            styling: {
                name: string;
                description: string;
            };
        };
    };
    demoTextField: {
        description: string;
        useCase: {
            statuses: {
                name: string;
                description: string;
                noStatus: {
                    label: string;
                    helper: string;
                    placeholder: string;
                };
                error: {
                    label: string;
                    helper: string;
                    placeholder: string;
                };
                disabled: {
                    label: string;
                    helper: string;
                    placeholder: string;
                };
            };
            passingContent: {
                name: string;
                description: string;
                viaLabel: {
                    labelTx: string;
                    helper: string;
                    placeholder: string;
                };
                rightAccessory: {
                    label: string;
                    helper: string;
                };
                leftAccessory: {
                    label: string;
                    helper: string;
                };
                supportsMultiline: {
                    label: string;
                    helper: string;
                };
            };
            styling: {
                name: string;
                description: string;
                styleInput: {
                    label: string;
                    helper: string;
                };
                styleInputWrapper: {
                    label: string;
                    helper: string;
                };
                styleContainer: {
                    label: string;
                    helper: string;
                };
                styleLabel: {
                    label: string;
                    helper: string;
                };
                styleAccessories: {
                    label: string;
                    helper: string;
                };
            };
        };
    };
    demoToggle: {
        description: string;
        useCase: {
            variants: {
                name: string;
                description: string;
                checkbox: {
                    label: string;
                    helper: string;
                };
                radio: {
                    label: string;
                    helper: string;
                };
                switch: {
                    label: string;
                    helper: string;
                };
            };
            statuses: {
                name: string;
                description: string;
                noStatus: string;
                errorStatus: string;
                disabledStatus: string;
            };
            passingContent: {
                name: string;
                description: string;
                useCase: {
                    checkBox: {
                        label: string;
                        helper: string;
                    };
                    checkBoxMultiLine: {
                        helper: string;
                    };
                    radioChangeSides: {
                        helper: string;
                    };
                    customCheckBox: {
                        label: string;
                    };
                    switch: {
                        label: string;
                        helper: string;
                    };
                    switchAid: {
                        label: string;
                    };
                };
            };
            styling: {
                name: string;
                description: string;
                outerWrapper: string;
                innerWrapper: string;
                inputDetail: string;
                labelTx: string;
                styleContainer: string;
            };
        };
    };
    demoButton: {
        description: string;
        useCase: {
            presets: {
                name: string;
                description: string;
            };
            passingContent: {
                name: string;
                description: string;
                viaTextProps: string;
                children: string;
                rightAccessory: string;
                leftAccessory: string;
                nestedChildren: string;
                nestedChildren2: string;
                nestedChildren3: string;
                multiLine: string;
            };
            styling: {
                name: string;
                description: string;
                styleContainer: string;
                styleText: string;
                styleAccessories: string;
                pressedState: string;
            };
            disabling: {
                name: string;
                description: string;
                standard: string;
                filled: string;
                reversed: string;
                accessory: string;
                textStyle: string;
            };
        };
    };
    demoListItem: {
        description: string;
        useCase: {
            height: {
                name: string;
                description: string;
                defaultHeight: string;
                customHeight: string;
                textHeight: string;
                longText: string;
            };
            separators: {
                name: string;
                description: string;
                topSeparator: string;
                topAndBottomSeparator: string;
                bottomSeparator: string;
            };
            icons: {
                name: string;
                description: string;
                leftIcon: string;
                rightIcon: string;
                leftRightIcons: string;
            };
            customLeftRight: {
                name: string;
                description: string;
                customLeft: string;
                customRight: string;
            };
            passingContent: {
                name: string;
                description: string;
                text: string;
                children: string;
                nestedChildren1: string;
                nestedChildren2: string;
            };
            listIntegration: {
                name: string;
                description: string;
            };
            styling: {
                name: string;
                description: string;
                styledText: string;
                styledContainer: string;
                tintedIcons: string;
            };
        };
    };
    demoCard: {
        description: string;
        useCase: {
            presets: {
                name: string;
                description: string;
                default: {
                    heading: string;
                    content: string;
                    footer: string;
                };
                reversed: {
                    heading: string;
                    content: string;
                    footer: string;
                };
            };
            verticalAlignment: {
                name: string;
                description: string;
                top: {
                    heading: string;
                    content: string;
                    footer: string;
                };
                center: {
                    heading: string;
                    content: string;
                    footer: string;
                };
                spaceBetween: {
                    heading: string;
                    content: string;
                    footer: string;
                };
                reversed: {
                    heading: string;
                    content: string;
                    footer: string;
                };
            };
            passingContent: {
                name: string;
                description: string;
                heading: string;
                content: string;
                footer: string;
            };
            customComponent: {
                name: string;
                description: string;
                rightComponent: string;
                leftComponent: string;
            };
            style: {
                name: string;
                description: string;
                heading: string;
                content: string;
                footer: string;
            };
        };
    };
    demoAutoImage: {
        description: string;
        useCase: {
            remoteUri: {
                name: string;
            };
            base64Uri: {
                name: string;
            };
            scaledToFitDimensions: {
                name: string;
                description: string;
                heightAuto: string;
                widthAuto: string;
                bothManual: string;
            };
        };
    };
    demoText: {
        description: string;
        useCase: {
            presets: {
                name: string;
                description: string;
                default: string;
                bold: string;
                subheading: string;
                heading: string;
            };
            sizes: {
                name: string;
                description: string;
                xs: string;
                sm: string;
                md: string;
                lg: string;
                xl: string;
                xxl: string;
            };
            weights: {
                name: string;
                description: string;
                light: string;
                normal: string;
                medium: string;
                semibold: string;
                bold: string;
            };
            passingContent: {
                name: string;
                description: string;
                viaText: string;
                viaTx: string;
                children: string;
                nestedChildren: string;
                nestedChildren2: string;
                nestedChildren3: string;
                nestedChildren4: string;
            };
            styling: {
                name: string;
                description: string;
                text: string;
                text2: string;
                text3: string;
            };
        };
    };
    demoHeader: {
        description: string;
        useCase: {
            actionIcons: {
                name: string;
                description: string;
                leftIconTitle: string;
                rightIconTitle: string;
                bothIconsTitle: string;
            };
            actionText: {
                name: string;
                description: string;
                leftTxTitle: string;
                rightTextTitle: string;
            };
            customActionComponents: {
                name: string;
                description: string;
                customLeftActionTitle: string;
            };
            titleModes: {
                name: string;
                description: string;
                centeredTitle: string;
                flexTitle: string;
            };
            styling: {
                name: string;
                description: string;
                styledTitle: string;
                styledWrapperTitle: string;
                tintedIconsTitle: string;
            };
        };
    };
    demoEmptyState: {
        description: string;
        useCase: {
            presets: {
                name: string;
                description: string;
            };
            passingContent: {
                name: string;
                description: string;
                customizeImageHeading: string;
                customizeImageContent: string;
                viaHeadingProp: string;
                viaContentProp: string;
                viaButtonProp: string;
            };
            styling: {
                name: string;
                description: string;
            };
        };
    };
    errorCode: {
        FORBIDDEN_ERROR: string;
        REJECTED_ERROR: string;
        SERVER_ERROR: string;
        UNAUTHORIZED_ERROR: string;
        NOT_FOUND_ERROR: string;
        CANNOT_CONNECT_ERROR: string;
        CANT_STORE_DATA: string;
        UNEXPECTED_PROPERTY: string;
        UNKNOWN_ERROR: string;
        REQUEST_TIMEOUT_ERROR: string;
        EMAIL_INVALID_ERROR: string;
        NAME_INVALID_ERROR: string;
        PASSWORD_INVALID_ERROR: string;
        LOCALE_INVALID_ERROR: string;
        CREDENTIALS_ERROR: string;
        AUTH_ERROR: string;
        SIGNUP_CATCH_ERROR: string;
        SIGNUP_CREATE_INITIAL_DATA_ERROR: string;
        SIGNUP_USER_ALREADY_EXISTS_ERROR: string;
        SIGNUP_PROFILE_NOT_CREATED_ERROR: string;
        EMAIL_VERIFICATION_CODE_STILL_ACTIVE_ERROR: string;
        EMAIL_VERIFICATION_ALREADY_DONE_ERROR: string;
        EMAIL_CANNOT_SEND_ERROR: string;
        EMAIL_VERIFICATION_CODE_EXPIRED_ERROR: string;
        EMAIL_VERIFICATION_FAILED_ERROR: string;
        SESSION_CREATE_ERROR: string;
        SESSION_DESTROY_ERROR: string;
        PROFILE_ERROR: string;
        OVERVIEW_ERROR: string;
        TRANSACTION_ERROR: string;
        ACCOUNT_ERROR: string;
        INCOME_ERROR: string;
        CATEGORY_ERROR: string;
        CURRENCY_ERROR: string;
        USER_ERROR: string;
        EMAIL_CONFIRMATION_ERROR: string;
    };
    validation: {
        valueRequired: string;
        valueTooShort: string;
        valueTooLong: string;
        valueInvalidRange: string;
        emailAlreadyInUse: string;
        maxLength: string;
        required: string;
        email: string;
        codeInvalided: string;
        name: string;
        password: string;
        passwordMinLength: string;
        passwordUppercase: string;
        passwordLowercase: string;
        passwordNumber: string;
        passwordSpecial: string;
        passwordRequirements: string;
    };
    signUpConfirmation: {
        title: string;
        description: string;
        enterCode: string;
        resendInfo: string;
        resendLimit: string;
        remainingAttempts: string;
        codeSent: string;
        invalidCode: string;
        expiredCode: string;
        limitReached: string;
        sendError: string;
        confirmError: string;
        validation: {
            required: string;
            exactLength: string;
            numbersOnly: string;
        };
        confirmButton: string;
        resendButton: string;
        success: string;
    };
    common: {
        amount: string;
        new: string;
        name: string;
        currency: string;
        loading: string;
        failedLoad: string;
        error: string;
        info: string;
        warning: string;
        ok: string;
        cancel: string;
        back: string;
        logOut: string;
        signUp: string;
        emailFieldLabel: string;
        passwordFieldLabel: string;
        emailFieldPlaceholder: string;
        passwordFieldPlaceholder: string;
        publicNameFieldLabel: string;
        publicNameFieldPlaceholder: string;
        confirmationCodeFieldLabel: string;
        confirmationCodeFieldPlaceholder: string;
        main: string;
        balance: string;
        incomes: string;
        expenses: string;
        accounts: string;
        unknown: string;
        transfer: string;
        history: string;
        settings: string;
        returnBack: string;
        transactions: string;
        selectAccount: string;
        account: string;
        expense: string;
        category: string;
        targetAccount: string;
        date: string;
        selectOption: string;
        deleteAccountTitle: string;
        deleteAccountMessage: string;
        deleteAccountSuccess: string;
        deleteAccountFailed: string;
        updateAccountSuccess: string;
        updateAccountFailed: string;
        createAccountSuccess: string;
        createAccountFailed: string;
    };
    categoryScreen: {
        createCategorySuccess: string;
        createCategoryFailed: string;
        deleteCategorySuccess: string;
        deleteCategoryFailed: string;
        deleteCategoryTitle: string;
        deleteCategoryMessage: string;
        updateCategorySuccess: string;
        updateCategoryFailed: string;
    };
    incomeScreen: {
        deleteTitle: string;
    };
    transactionScreen: {
        recentActivity: string;
        from: string;
        to: string;
        description: string;
        optionalDescription: string;
        deleteTitle: string;
        deleteMessage: string;
        deleteSuccess: string;
        deleteFailed: string;
        updateSuccess: string;
        updateFailed: string;
        createSuccess: string;
        createFailed: string;
    };
    welcomeScreen: {
        postscript: string;
        readyForLaunch: string;
        exciting: string;
        letsGo: string;
    };
    errorScreen: {
        title: string;
        friendlySubtitle: string;
        reset: string;
        traceTitle: string;
    };
    emptyStateComponent: {
        generic: {
            heading: string;
            content: string;
            button: string;
        };
    };
    pendingStateComponent: {
        heading: string;
        content: string;
        button: string;
    };
    errors: {
        invalidEmail: string;
    };
    loginScreen: {
        logIn: string;
        enterDetails: string;
        hint: string;
        tapToLogIn: string;
        rememberMe: string;
        rememberMeHelper: string;
        reLoginRequired: string;
    };
    signUpScreen: {
        enterDetails: string;
        tapToLogIn: string;
        repeatPasswordFieldLabel: string;
        repeatPasswordFieldPlaceholder: string;
    };
    demoNavigator: {
        componentsTab: string;
        debugTab: string;
        communityTab: string;
        podcastListTab: string;
    };
    demoCommunityScreen: {
        title: string;
        tagLine: string;
        joinUsOnSlackTitle: string;
        joinUsOnSlack: string;
        joinSlackLink: string;
        makeIgniteEvenBetterTitle: string;
        makeIgniteEvenBetter: string;
        contributeToIgniteLink: string;
        theLatestInReactNativeTitle: string;
        theLatestInReactNative: string;
        reactNativeRadioLink: string;
        reactNativeNewsletterLink: string;
        reactNativeLiveLink: string;
        chainReactConferenceLink: string;
        hireUsTitle: string;
        hireUs: string;
        hireUsLink: string;
    };
    demoShowroomScreen: {
        jumpStart: string;
        lorem2Sentences: string;
        demoHeaderTxExample: string;
        demoViaTxProp: string;
        demoViaSpecifiedTxProp: string;
    };
    demoDebugScreen: {
        howTo: string;
        title: string;
        tagLine: string;
        reactotron: string;
        reportBugs: string;
        demoList: string;
        demoPodcastList: string;
        androidReactotronHint: string;
        iosReactotronHint: string;
        macosReactotronHint: string;
        webReactotronHint: string;
        windowsReactotronHint: string;
    };
    demoPodcastListScreen: {
        title: string;
        onlyFavorites: string;
        favoriteButton: string;
        unfavoriteButton: string;
        accessibility: {
            cardHint: string;
            switch: string;
            favoriteAction: string;
            favoriteIcon: string;
            unfavoriteIcon: string;
            publishLabel: string;
            durationLabel: string;
        };
        noFavoritesEmptyState: {
            heading: string;
            content: string;
        };
    };
};
export default en;
export type Translations = typeof en;
