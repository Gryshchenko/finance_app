import { ImageProps } from 'react-native';

export interface AutoImageProps extends ImageProps {
    /**
     * How wide should the image be?
     */
    maxWidth?: number;
    /**
     * How tall should the image be?
     */
    maxHeight?: number;
    headers?: Record<string, string>;
}
/**
 * A hook that will return the scaled dimensions of an image based on the
 * provided dimensions' aspect ratio. If no desired dimensions are provided,
 * it will return the original dimensions of the remote image.
 *
 * How is this different from `resizeMode: 'contain'`? Firstly, you can
 * specify only one side's size (not both). Secondly, the image will scale to fit
 * the desired dimensions instead of just being contained within its image-container.
 * @param {number} remoteUri - The URI of the remote image.
 * @param {number} dimensions - The desired dimensions of the image. If not provided, the original dimensions will be returned.
 * @returns {[number, number]} - The scaled dimensions of the image.
 */
export declare function useAutoImage(
    remoteUri: string,
    headers?: Record<string, string>,
    dimensions?: [maxWidth?: number, maxHeight?: number],
): [width: number, height: number];
/**
 * An Image component that automatically sizes a remote or data-uri image.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/AutoImage/}
 * @param {AutoImageProps} props - The props for the `AutoImage` component.
 * @returns {JSX.Element} The rendered `AutoImage` component.
 */
export declare function AutoImage(props: AutoImageProps): import('react').JSX.Element;
