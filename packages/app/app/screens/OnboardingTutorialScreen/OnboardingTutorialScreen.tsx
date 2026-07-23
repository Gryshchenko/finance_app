import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTutorials } from '@/hooks/useTutorials';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';

import { SlideKey, SlidePreview } from './SlidePreviews';
import {
    $body,
    $buttons,
    $back,
    $center,
    $copy,
    $dot,
    $dotActive,
    $dots,
    $footer,
    $kicker,
    $next,
    $screen,
    $skip,
    $skipRow,
    $stage,
    $title,
} from './styles';

const SLIDES: { key: SlideKey; kicker: TxKeyPath; title: TxKeyPath; body: TxKeyPath }[] = [
    {
        key: 'welcome',
        kicker: 'onboardingTutorialScreen:slides.welcome.kicker',
        title: 'onboardingTutorialScreen:slides.welcome.title',
        body: 'onboardingTutorialScreen:slides.welcome.body',
    },
    {
        key: 'accounts',
        kicker: 'onboardingTutorialScreen:slides.accounts.kicker',
        title: 'onboardingTutorialScreen:slides.accounts.title',
        body: 'onboardingTutorialScreen:slides.accounts.body',
    },
    {
        key: 'dashboard',
        kicker: 'onboardingTutorialScreen:slides.dashboard.kicker',
        title: 'onboardingTutorialScreen:slides.dashboard.title',
        body: 'onboardingTutorialScreen:slides.dashboard.body',
    },
    {
        key: 'insights',
        kicker: 'onboardingTutorialScreen:slides.insights.kicker',
        title: 'onboardingTutorialScreen:slides.insights.title',
        body: 'onboardingTutorialScreen:slides.insights.body',
    },
    {
        key: 'income',
        kicker: 'onboardingTutorialScreen:slides.income.kicker',
        title: 'onboardingTutorialScreen:slides.income.title',
        body: 'onboardingTutorialScreen:slides.income.body',
    },
    {
        key: 'sharing',
        kicker: 'onboardingTutorialScreen:slides.sharing.kicker',
        title: 'onboardingTutorialScreen:slides.sharing.title',
        body: 'onboardingTutorialScreen:slides.sharing.body',
    },
    {
        key: 'categories',
        kicker: 'onboardingTutorialScreen:slides.categories.kicker',
        title: 'onboardingTutorialScreen:slides.categories.title',
        body: 'onboardingTutorialScreen:slides.categories.body',
    },
];

interface Props {
    onDone: () => void;
    reportView?: boolean;
}

export function OnboardingTutorialScreen({ onDone, reportView = false }: Props) {
    const { themed } = useAppTheme();
    const { markSeen } = useTutorials();
    const [i, setI] = useState(0);
    const viewedSlides = useRef(new Set([0]));
    const isLast = i === SLIDES.length - 1;
    const slide = SLIDES[i];

    const goTo = (index: number) => {
        viewedSlides.current.add(index);
        setI(index);
    };

    const finish = () => {
        if (reportView) {
            markSeen('isOnBoardingTutorialView', { onBoardingViewedSlidesCount: viewedSlides.current.size });
        }
        onDone();
    };

    return (
        <Screen preset="fixed" contentContainerStyle={themed($screen)} safeAreaEdges={['top', 'bottom']}>
            <View style={$skipRow}>
                {!isLast && (
                    <Pressable onPress={() => goTo(SLIDES.length - 1)} hitSlop={12}>
                        <Text tx="onboardingTutorialScreen:skip" style={themed($skip)} />
                    </Pressable>
                )}
            </View>

            <View style={$center}>
                <View style={$stage}>
                    <SlidePreview slideKey={slide.key} />
                </View>
                <View style={$copy}>
                    <Text tx={slide.kicker} style={themed($kicker)} />
                    <Text tx={slide.title} style={themed($title)} />
                    <Text tx={slide.body} style={themed($body)} />
                </View>
            </View>

            <View style={$footer}>
                <View style={$dots}>
                    {SLIDES.map((_, d) => (
                        <Pressable key={d} onPress={() => goTo(d)} hitSlop={8}>
                            <View style={[themed($dot), d === i && themed($dotActive)]} />
                        </Pressable>
                    ))}
                </View>
                <View style={$buttons}>
                    {i > 0 && <Button tx="onboardingTutorialScreen:back" style={$back} onPress={() => goTo(i - 1)} />}
                    <Button
                        preset="reversed"
                        tx={isLast ? 'onboardingTutorialScreen:getStarted' : 'onboardingTutorialScreen:next'}
                        style={$next}
                        onPress={() => (isLast ? finish() : goTo(i + 1))}
                    />
                </View>
            </View>
        </Screen>
    );
}
