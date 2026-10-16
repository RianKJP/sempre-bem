import { useEffect, useRef, useState } from "react";
import {
    FlatList,
    Image,
    type ImageSourcePropType,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    StyleSheet,
    View,
} from "react-native";

const AUTO_PLAY_INTERVAL_MS = 4500;
const BANNER_HEIGHT = 148;

type Banner = {
    accessibilityLabel: string;
    id: string;
    source: ImageSourcePropType;
};

const BANNERS: Banner[] = [
    {
        id: "tranquilidade",
        accessibilityLabel: "Mais tranquilidade para sua família",
        source: require("@/assets/img/banner_1.png"),
    },
    {
        id: "autonomia",
        accessibilityLabel: "Rotina com mais autonomia",
        source: require("@/assets/img/banner_2.png"),
    },
    {
        id: "conexao",
        accessibilityLabel: "Cuidado que aproxima",
        source: require("@/assets/img/banner_3.png"),
    },
];

const LOOPING_BANNERS = [
    BANNERS[BANNERS.length - 1],
    ...BANNERS,
    BANNERS[0],
];

export function HomeBannerCarousel() {
    const listRef = useRef<FlatList<Banner>>(null);
    const currentIndexRef = useRef(1);
    const [activeIndex, setActiveIndex] = useState(0);
    const [carouselWidth, setCarouselWidth] = useState(0);

    useEffect(() => {
        if (!carouselWidth) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({
                animated: false,
                offset: currentIndexRef.current * carouselWidth,
            });
        });

        return () => cancelAnimationFrame(frame);
    }, [carouselWidth]);

    useEffect(() => {
        if (!carouselWidth) {
            return;
        }

        const interval = setInterval(() => {
            const nextIndex = currentIndexRef.current + 1;
            currentIndexRef.current = nextIndex;
            listRef.current?.scrollToOffset({
                animated: true,
                offset: nextIndex * carouselWidth,
            });
        }, AUTO_PLAY_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [carouselWidth]);

    function handleMomentumScrollEnd(
        event: NativeSyntheticEvent<NativeScrollEvent>,
    ) {
        if (!carouselWidth) {
            return;
        }

        const visibleIndex = Math.round(
            event.nativeEvent.contentOffset.x / carouselWidth,
        );
        const bannerIndex =
            (visibleIndex - 1 + BANNERS.length) % BANNERS.length;

        setActiveIndex(bannerIndex);

        if (visibleIndex === 0 || visibleIndex === LOOPING_BANNERS.length - 1) {
            const loopIndex = visibleIndex === 0 ? BANNERS.length : 1;
            currentIndexRef.current = loopIndex;

            requestAnimationFrame(() => {
                listRef.current?.scrollToOffset({
                    animated: false,
                    offset: loopIndex * carouselWidth,
                });
            });
            return;
        }

        currentIndexRef.current = visibleIndex;
    }

    return (
        <View
            onLayout={(event) =>
                setCarouselWidth(event.nativeEvent.layout.width)
            }
            style={styles.container}
        >
            {carouselWidth > 0 ? (
                <FlatList
                    data={LOOPING_BANNERS}
                    decelerationRate="fast"
                    getItemLayout={(_, index) => ({
                        index,
                        length: carouselWidth,
                        offset: carouselWidth * index,
                    })}
                    horizontal
                    initialScrollIndex={1}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    pagingEnabled
                    ref={listRef}
                    renderItem={({ item }) => (
                        <View style={[styles.bannerFrame, { width: carouselWidth }]}>
                            <Image
                                accessibilityLabel={item.accessibilityLabel}
                                resizeMode="cover"
                                source={item.source}
                                style={styles.banner}
                            />
                        </View>
                    )}
                    showsHorizontalScrollIndicator={false}
                    style={styles.viewport}
                />
            ) : null}

            <View accessibilityLabel={`Banner ${activeIndex + 1} de ${BANNERS.length}`} style={styles.pagination}>
                {BANNERS.map((banner, index) => (
                    <View
                        key={banner.id}
                        style={[
                            styles.dot,
                            index === activeIndex && styles.dotActive,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginTop: 22 },
    viewport: {
        height: BANNER_HEIGHT,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "#EFE9DD",
    },
    bannerFrame: {
        height: BANNER_HEIGHT,
        overflow: "hidden",
    },
    banner: {
        width: "100%",
        height: BANNER_HEIGHT,
    },
    pagination: {
        minHeight: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        marginTop: 8,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#D4CCC3",
    },
    dotActive: {
        width: 20,
        backgroundColor: "#713568",
    },
});
