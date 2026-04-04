export declare const customFontsToLoad: {
    spaceGroteskLight: number;
    spaceGroteskRegular: number;
    spaceGroteskMedium: number;
    spaceGroteskSemiBold: number;
    spaceGroteskBold: number;
};
export declare const typography: {
    /**
     * The fonts are available to use, but prefer using the semantic name.
     */
    fonts: {
        spaceGrotesk: {
            light: string;
            normal: string;
            medium: string;
            semiBold: string;
            bold: string;
        };
        helveticaNeue: {
            thin: string;
            light: string;
            normal: string;
            medium: string;
        };
        courier: {
            normal: string;
        };
        sansSerif: {
            thin: string;
            light: string;
            normal: string;
            medium: string;
        };
        monospace: {
            normal: string;
        };
    };
    /**
     * The primary font. Used in most places.
     */
    primary: {
        light: string;
        normal: string;
        medium: string;
        semiBold: string;
        bold: string;
    };
    /**
     * An alternate font used for perhaps titles and stuff.
     */
    secondary:
        | {
              thin: string;
              light: string;
              normal: string;
              medium: string;
          }
        | undefined;
    /**
     * Lets get fancy with a monospace font!
     */
    code:
        | {
              normal: string;
          }
        | undefined;
};
