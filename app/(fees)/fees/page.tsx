"use client";
import FeesContainer from "@/components/layout/FeesContainer";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import useSWR from "swr";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import Header from "./Header";
import { useTransition, animated } from "@react-spring/web";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import OffScreenSlider from "./OffScreenSlider";
import SliderChart from "./SliderChart";
import Footer from "./Footer";
import FeesHorizontalScrollContainer from "@/components/FeesHorizontalScrollContainer";

interface HoveredItems {
  hoveredChain: string | null;
  hoveredDA: string | null;
}

interface DAvailability {
  icon: string;
  label: string;
}

export default function FeesPage() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [selectedTimescale, setSelectedTimescale] = useState("hourly");
  const [selectedQuantitative, setSelectedQuantitative] =
    useState("txcosts_median");
  const [selectedQualitative, setSelectedQualitative] = useState<null | string>(
    null,
  );
  const [selectedAvailability, setSelectedAvailability] =
    useState<string>("blobs");

  const [hoveredItems, setHoveredItems] = useState<HoveredItems>({
    hoveredChain: null,
    hoveredDA: null,
  });
  const [hoverBarIndex, setHoverBarIndex] = useState<Number | null>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState(23);

  const [sortOrder, setSortOrder] = useState(true);
  //True is default descending false ascending
  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
      return acc;
    }, {}),
  );

  // start Bottom Chart state
  const [isChartOpen, setIsChartOpen] = useState(false);

  const timescales = useMemo(() => {
    return {
      thirty_min: {
        label: "Last 30 Minutes",
      },
      hourly: {
        label: "Last Hour",
      },
      six_hours: {
        label: "Last 6 Hours",
      },
      twelve_hours: {
        label: "Last 12 Hours",
      },
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      txcosts_median: {
        title: "Median Fee",
      },
      txcosts_native_median: {
        title: "Transfer ETH",
      },
      txcosts_swap: {
        title: "Swap Token",
      },
    };
  }, []);

  function dataAvailToArray(x: string): DAvailability[] {
    let retObject: DAvailability[] = [];
    if (typeof x === "string") {
      // Ensure x is a string
      if (x.includes("calldata")) {
        retObject.push({
          icon: "calldata",
          label: "Calldata",
        });
      }

      if (x.includes("blobs")) {
        retObject.push({
          icon: "blobs",
          label: "Blobs",
        });
      }

      if (x.includes("MantleDA")) {
        retObject.push({
          icon: "customoffchain",
          label: "MantleDA",
        });
      }
    }
    return retObject;
  }

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR("https://api.growthepie.xyz/v1/fees/table.json");

  const sortByChains = useMemo(() => {
    if (!feeData) return [];

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const isSelectedA = selectedChains[a];
        const isSelectedB = selectedChains[b];

        // If sortOrder is false, reverse the comparison
        const comparison = sortOrder ? 1 : -1;

        // Compare chain names alphabetically
        const chainNameComparison = a.localeCompare(b);

        // If both chains are selected or unselected, sort by chain name
        if (isSelectedA === isSelectedB) {
          return chainNameComparison * comparison;
        }

        // Prioritize selected chains
        return isSelectedA ? -1 : 1;
      });

    return sortedChains;
  }, [feeData, selectedChains, sortOrder]);

  const sortByCallData = useMemo(() => {
    if (!feeData || !master) return [];

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const availabilityA = dataAvailToArray(master.chains[a].da_layer);
        const availabilityB = dataAvailToArray(master.chains[b].da_layer);

        // Check if availabilityA or availabilityB contains selectedAvailability
        const containsAvailabilityA = availabilityA.some(
          (item) => item.icon === selectedAvailability,
        );
        const containsAvailabilityB = availabilityB.some(
          (item) => item.icon === selectedAvailability,
        );

        // Check isSelected for chains a and b
        const isSelectedA = selectedChains[a];
        const isSelectedB = selectedChains[b];

        // Sort based on availability and isSelected
        if (isSelectedA && !isSelectedB) {
          return -1;
        } else if (!isSelectedA && isSelectedB) {
          return 1;
        } else if (containsAvailabilityA && !containsAvailabilityB) {
          return -1;
        } else if (!containsAvailabilityA && containsAvailabilityB) {
          return 1;
        } else {
          // If both contain or don't contain the selected availability and isSelected, sort alphabetically
          return a.localeCompare(b);
        }
      });

    // Reverse the sorted chains if sortOrder is false
    if (!sortOrder) {
      sortedChains.reverse();
    }

    return sortedChains;
  }, [feeData, master, selectedChains, selectedAvailability, sortOrder]);

  const sortByMetric = useMemo(() => {
    if (!feeData) return [];

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const isSelectedA = selectedChains[a];
        const isSelectedB = selectedChains[b];

        // If sortOrder is false, reverse the comparison
        const comparison = sortOrder ? 1 : -1;

        // Handle cases where one or both chains are not selected
        if (isSelectedA && !isSelectedB) return -1;
        if (!isSelectedA && isSelectedB) return 1;

        const aData =
          feeData.chain_data[a]["hourly"][selectedQuantitative].data;
        const bData =
          feeData.chain_data[b]["hourly"][selectedQuantitative].data;

        // Handle empty array case
        if (aData.length === 0 && bData.length === 0) {
          // Both arrays are empty, prioritize based on selection
          return isSelectedA ? -1 : isSelectedB ? 1 : 0;
        } else if (aData.length === 0) {
          // aData is empty, prioritize based on sortOrder
          return sortOrder ? 1 : -1;
        } else if (bData.length === 0) {
          // bData is empty, prioritize based on sortOrder
          return sortOrder ? -1 : 1;
        }

        // If both chains are selected or unselected, sort by median cost
        const aTxCost = aData[23 - selectedBarIndex]
          ? aData[23 - selectedBarIndex][showUsd ? 2 : 1]
          : null;
        const bTxCost = bData[23 - selectedBarIndex]
          ? bData[23 - selectedBarIndex][showUsd ? 2 : 1]
          : null;

        if (aTxCost === null && bTxCost === null) return 0;
        if (aTxCost === null) return 1 * comparison;
        if (bTxCost === null) return -1 * comparison;

        return (aTxCost - bTxCost) * comparison;
      });

    return sortedChains;
  }, [
    feeData,
    selectedChains,
    selectedQuantitative,
    showUsd,
    selectedBarIndex,
    sortOrder,
  ]);

  const finalSort = useMemo(() => {
    if (!feeData) return [];

    if (selectedQualitative) {
      if (selectedQualitative === "chain") {
        return sortByChains;
      } else {
        return sortByCallData;
      }
    } else {
      return sortByMetric;
    }
  }, [
    sortByChains,
    sortByMetric,
    sortByCallData,
    selectedQualitative,
    sortOrder,
  ]);

  const feeIndexSort = useMemo(() => {
    if (!feeData) return [];

    const indices = Array.from({ length: 24 }, (_, i) => i); // Create an array from 0 to 23

    const sortedCosts = indices.map((index) => {
      const chainsData = Object.entries(feeData.chain_data).map(
        ([chain, data]) => ({
          chain,
          txCost: (data as any)["hourly"][selectedQuantitative]?.data[index]
            ? (data as any)["hourly"][selectedQuantitative]?.data[index][
                showUsd ? 2 : 1
              ]
            : null,
        }),
      );

      const filteredChainsData = chainsData.filter(
        ({ txCost }) => txCost !== null,
      );

      const sortedChains = filteredChainsData.sort((a, b) => {
        return a.txCost - b.txCost;
      });

      return sortedChains.reduce((acc, { chain }) => {
        if (
          feeData.chain_data[chain]?.["hourly"]?.[selectedQuantitative]?.data?.[
            index
          ] !== undefined
        ) {
          acc[chain] =
            feeData.chain_data[chain]?.["hourly"]?.[
              selectedQuantitative
            ]?.data?.[index];
        }
        return acc;
      }, {});
    });

    // Filter out the "ethereum" chain
    const filteredSortedCosts = sortedCosts.map((costs) => {
      delete costs["ethereum"];
      return costs;
    });

    return filteredSortedCosts;
  }, [feeData, showUsd, selectedQuantitative]);

  const optIndex = useMemo(() => {
    let pickIndex = hoverBarIndex ? hoverBarIndex : selectedBarIndex;
    let retIndex = 23 - Number(pickIndex);
    return retIndex;
  }, [selectedBarIndex, hoverBarIndex]);

  const [screenHeight, setScreenHeight] = useState(0);

  useLayoutEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight - 120);
    };

    setScreenHeight(window.innerHeight - 120);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getGradientColor = (percentage) => {
    const colors = [
      { percent: 0, color: "#1DF7EF" },
      { percent: 20, color: "#76EDA0" },
      { percent: 50, color: "#FFDF27" },
      { percent: 70, color: "#FF9B47" },
      { percent: 100, color: "#FE5468" },
    ];

    let lowerBound = colors[0];
    let upperBound = colors[colors.length - 1];

    for (let i = 0; i < colors.length - 1; i++) {
      if (
        percentage >= colors[i].percent &&
        percentage <= colors[i + 1].percent
      ) {
        lowerBound = colors[i];
        upperBound = colors[i + 1];
        break;
      }
    }

    const percentDiff =
      (percentage - lowerBound.percent) /
      (upperBound.percent - lowerBound.percent);

    const r = Math.floor(
      parseInt(lowerBound.color.substring(1, 3), 16) +
        percentDiff *
          (parseInt(upperBound.color.substring(1, 3), 16) -
            parseInt(lowerBound.color.substring(1, 3), 16)),
    );

    const g = Math.floor(
      parseInt(lowerBound.color.substring(3, 5), 16) +
        percentDiff *
          (parseInt(upperBound.color.substring(3, 5), 16) -
            parseInt(lowerBound.color.substring(3, 5), 16)),
    );

    const b = Math.floor(
      parseInt(lowerBound.color.substring(5, 7), 16) +
        percentDiff *
          (parseInt(upperBound.color.substring(5, 7), 16) -
            parseInt(lowerBound.color.substring(5, 7), 16)),
    );

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const transitions = useTransition(
    Object.entries(finalSort).map((chain, index) => {
      return {
        y: index * 38,
        height: 34,
        chain: chain, // Assuming `chain` is used as a key
      };
    }),
    {
      key: (d) => d.chain[1],
      from: { height: 0 },
      leave: { height: 0 },
      enter: ({ y, height }) => ({ y, height }),
      update: ({ y, height }) => ({ y, height }), // Ensure height change is animated
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  return (
    <>
      {feeData && master && (
        <div
        // className={`overflow-y-scroll overflow-x-hidden w-full gap-y-1 `}
        // style={{
        //   maxHeight: screenHeight,
        // }}
        >
          <Header />

          <FeesContainer className={`w-full hidden md:block`}>
            <div className="flex px-[5px] items-center w-full h-[54px] rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000]">
              <a
                className="flex items-center w-[162px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-2 gap"
                href="https://www.growthepie.xyz/"
                target="_blank"
              >
                <Icon icon="gtp:house" className="h-6 w-6" />
                <div className="font-bold">Main platform</div>
              </a>
            </div>
          </FeesContainer>
          {/* <div className="w-full h-[70px]" /> */}
          <FeesContainer className="w-full mt-[30px] ">
            <div className="flex w-full justify-between px-[10px] items-center ">
              <div
                className={`flex text-[20px] font-bold items-center  ${
                  isMobile ? "w-full " : "w-auto"
                }`}
              >
                {isMobile ? (
                  <p className="w-[82vh] inline-block relative">
                    <p className="inline leading-8">{`How much a typical user paid `}</p>
                    <span className="absolute justify-center items-center bottom-1 w-[92px] h-[26px] border-[#344240] border-[1.5px] bg-[#1F2726] text-[12px] ml-1 rounded-r-full inline-flex">
                      {24 - selectedBarIndex === 1
                        ? "1 Hour Ago"
                        : `${24 - selectedBarIndex} hours ago`}
                    </span>
                  </p>
                ) : (
                  <div className="flex w-full items-center">
                    {" "}
                    {`How much a typical user paid`}
                    <span className="w-[92px] h-[26px] flex items-center justify-center border-[#344240] border-[1.5px] bg-[#1F2726] text-[12px] ml-1 rounded-r-full">
                      {24 - selectedBarIndex === 1
                        ? "1 Hour Ago"
                        : `${24 - selectedBarIndex} hours ago`}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-[165px] h-[25px] flex bg-transparent px-0.5 items-center justify-between pr-[2px] rounded-full "></div>
            </div>
          </FeesContainer>
          <FeesHorizontalScrollContainer>
            <div className="relative">
              <div
                className={`w-[800px] mt-[8px] flex h-[26px] justify-start mb-1 text-[12px] font-bold ${
                  isMobile ? "pl-[32px]" : "pl-[42px]"
                }`}
              >
                <div
                  className={`flex items-center gap-x-0.5 hover:cursor-pointer  ${
                    isMobile ? "w-[18%]" : "w-[29.25%]"
                  }`}
                >
                  <div
                    className="flex items-center gap-x-0.5"
                    onClick={() => {
                      if (selectedQualitative === "chain") {
                        setSortOrder(!sortOrder);
                      } else {
                        setSelectedQualitative("chain");
                      }
                    }}
                  >
                    Chain{" "}
                    <Icon
                      icon={
                        selectedQualitative === "chain"
                          ? sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                          : "formkit:arrowdown"
                      }
                      className={` dark:text-white text-black w-[10px] h-[10px] ${
                        selectedQualitative === "chain"
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                    />{" "}
                  </div>
                  <div
                    className="bg-[#344240] text-[8px] flex rounded-full font-normal items-center px-[5px] py-[3px] gap-x-[2px] hover:cursor-pointer"
                    onClick={() => {
                      if (selectedQualitative === "availability") {
                        setSortOrder(!sortOrder);
                      } else {
                        setSelectedQualitative("availability");
                      }
                    }}
                  >
                    Data Availability{" "}
                    <Icon
                      icon={
                        selectedQualitative === "availability"
                          ? sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                          : "formkit:arrowdown"
                      }
                      className={` dark:text-white text-black w-[10px] h-[10px] ${
                        selectedQualitative === "availability"
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                    />{" "}
                  </div>
                </div>

                <div
                  className={`flex items-center justify-end gap-x-0.5 hover:cursor-pointer ${
                    isMobile ? "w-[11%]" : "w-[18.5%]"
                  }`}
                  onClick={() => {
                    if (selectedQuantitative === "txcosts_median") {
                      if (selectedQualitative) {
                        setSelectedQualitative(null);
                      } else {
                        setSortOrder(!sortOrder);
                      }
                    } else {
                      setSelectedQualitative(null);
                      setSelectedQuantitative("txcosts_median");
                    }
                  }}
                >
                  Median Fee{" "}
                  <Icon
                    icon={
                      !selectedQualitative &&
                      selectedQuantitative === "txcosts_median"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black w-[10px] h-[10px] ${
                      !selectedQualitative &&
                      selectedQuantitative === "txcosts_median"
                        ? "opacity-100"
                        : "opacity-20"
                    }`}
                  />{" "}
                </div>
                <div
                  className={`flex items-center justify-end gap-x-0.5  hover:cursor-pointer ${
                    isMobile ? "w-[12%]" : "w-[16%]"
                  }`}
                  onClick={() => {
                    if (selectedQuantitative === "txcosts_native_median") {
                      if (selectedQualitative) {
                        setSelectedQualitative(null);
                      } else {
                        setSortOrder(!sortOrder);
                      }
                    } else {
                      setSelectedQualitative(null);
                      setSelectedQuantitative("txcosts_native_median");
                    }
                  }}
                >
                  Transfer ETH{" "}
                  <Icon
                    icon={
                      !selectedQualitative &&
                      selectedQuantitative === "txcosts_native_median"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black w-[10px] h-[10px] ${
                      !selectedQualitative &&
                      selectedQuantitative === "txcosts_native_median"
                        ? "opacity-100"
                        : "opacity-20"
                    }`}
                  />{" "}
                </div>
                <div
                  className={`flex items-center justify-end gap-x-0.5   hover:cursor-pointer ${
                    isMobile
                      ? "w-[11%]  mr-[5px]"
                      : "w-[13.5%] mr-[23.5px] sm:mr-[5px]"
                  }`}
                  onClick={() => {
                    if (selectedQuantitative === "txcosts_swap") {
                      if (selectedQualitative) {
                        setSelectedQualitative(null);
                      } else {
                        setSortOrder(!sortOrder);
                      }
                    } else {
                      setSelectedQualitative(null);
                      setSelectedQuantitative("txcosts_swap");
                    }
                  }}
                >
                  <div>Swap Token </div>
                  <Icon
                    icon={
                      !selectedQualitative &&
                      selectedQuantitative === "txcosts_swap"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black w-[10px] h-[10px] ${
                      !selectedQualitative &&
                      selectedQuantitative === "txcosts_swap"
                        ? "opacity-100"
                        : "opacity-20"
                    }`}
                  />{" "}
                </div>
                <div className="relative -top-[5px] flex flex-col items-end space-x-[1px] font-normal ">
                  <div
                    className={`relative right-1 w-[29px] h-[12px] text-[8px] ${
                      selectedBarIndex >= 18 && selectedBarIndex <= 22
                        ? "top-0 transition-all duration-300"
                        : "top-3 transition-all duration-300"
                    }`}
                  >
                    hourly
                  </div>
                  <div className="flex space-x-[1px] items-end">
                    {Array.from({ length: 24 }, (_, index) => (
                      <div
                        key={index.toString() + "columns"}
                        className={`hover:cursor-pointer transition-transform duration-300 w-[5px]  rounded-t-full ${
                          selectedBarIndex === index
                            ? "w-[8px] border-[#344240] border-t-[1px] border-x-[1px] h-[23px] "
                            : hoverBarIndex === index
                            ? "w-[5px] bg-[#344240] h-[14px]"
                            : "w-[5px] bg-[#344240] h-[8px]"
                        }`}
                        onMouseEnter={() => {
                          setHoverBarIndex(index);
                        }}
                        onMouseLeave={() => {
                          setHoverBarIndex(null);
                        }}
                        onClick={() => {
                          setSelectedBarIndex(index);
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              <div
                className={`gap-y-1 relative`}
                style={{ minHeight: finalSort.length * 38 }}
              >
                {transitions((style, item) => {
                  let passMedian =
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_median
                      ?.data[optIndex] &&
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_median
                      ?.data[optIndex][showUsd ? 2 : 1];

                  let passTransfer =
                    feeData.chain_data[item.chain[1]]?.hourly
                      ?.txcosts_native_median?.data[optIndex] &&
                    feeData.chain_data[item.chain[1]]?.hourly
                      ?.txcosts_native_median?.data[optIndex][showUsd ? 2 : 1];

                  let passSwap =
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_swap
                      .data[optIndex] &&
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_swap
                      ?.data[optIndex][showUsd ? 2 : 1];

                  return (
                    <animated.div
                      key={item.chain[0]}
                      className={`border-forest-700 border-[1px] mb-1 absolute rounded-full border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[10px] flex items-center
                      ${
                        isMobile
                          ? "text-[12px] w-[600px]"
                          : "text-[14px] w-[800px]"
                      } ${
                        selectedChains[item.chain[1]]
                          ? "opacity-100"
                          : "opacity-50"
                      }`}
                      style={{ ...style }}
                    >
                      <div className={`flex items-center h-full w-[4%] `}>
                        <Icon
                          icon={`gtp:${
                            AllChainsByKeys[item.chain[1]].urlKey
                          }-logo-monochrome`}
                          className={`${
                            isMobile ? "h-[18px] w-[18px]" : "h-[24px] w-[24px]"
                          }`}
                          style={{
                            color:
                              AllChainsByKeys[item.chain[1]].colors[theme][0],
                          }}
                        />
                      </div>
                      <div
                        className={`flex justify-start items-center h-full ${
                          isMobile ? "w-[23%]" : "w-[33%]"
                        }`}
                      >
                        <div className="mr-[5px]">
                          {isMobile
                            ? master.chains[item.chain[1]].name_short
                            : AllChainsByKeys[item.chain[1]].label}
                        </div>
                        <div
                          className={`bg-[#344240] flex rounded-full  items-center  transition-width overflow-hidden duration-300 ${
                            isMobile
                              ? "px-[4px] py-[2px] gap-x-[1px]"
                              : "px-[5px] py-[3px] gap-x-[2px]"
                          }`}
                          onMouseEnter={() => {
                            setHoveredItems({
                              hoveredChain: item.chain[1],
                              hoveredDA: hoveredItems.hoveredDA,
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredItems({
                              hoveredChain: null,
                              hoveredDA: hoveredItems.hoveredDA,
                            });
                          }}
                        >
                          {dataAvailToArray(
                            master.chains[item.chain[1]].da_layer,
                          ).map((avail, index, array) => [
                            <div
                              key={avail.icon}
                              className={`flex relative items-center gap-x-0.5 hover:cursor-pointer`}
                              onMouseEnter={() => {
                                setHoveredItems({
                                  hoveredChain: hoveredItems.hoveredChain,
                                  hoveredDA: avail.label,
                                });
                              }}
                              onMouseLeave={() => {
                                setHoveredItems({
                                  hoveredChain: hoveredItems.hoveredChain,
                                  hoveredDA: null,
                                });
                              }}
                              onClick={() => {
                                if (selectedQualitative !== "availability") {
                                  setSelectedQualitative("availability");
                                }
                                setSelectedAvailability(avail.icon);
                              }}
                            >
                              <Icon
                                icon={`gtp:${avail.icon}`}
                                className={`${
                                  selectedAvailability === avail.icon &&
                                  selectedQualitative === "availability"
                                    ? "text-forest-200"
                                    : "text-[#5A6462] "
                                }
                                  ${
                                    isMobile
                                      ? "h-[10px] w-[10px] "
                                      : "h-[12px] w-[12px] "
                                  }`}
                              />
                              <div
                                className={`text-[8px] text-center font-semibold overflow-hidden ${
                                  selectedAvailability === avail.icon &&
                                  selectedQualitative === "availability"
                                    ? "text-forest-200"
                                    : "text-[#5A6462] "
                                } `}
                                style={{
                                  maxWidth:
                                    hoveredItems.hoveredDA === avail.label &&
                                    hoveredItems.hoveredChain === item.chain[1]
                                      ? "50px"
                                      : "0px",
                                  transition: "max-width 0.3s ease", // Adjust duration and timing function as needed
                                }}
                              >
                                {avail.label}
                              </div>
                            </div>,
                            index !== array.length - 1 && (
                              /* Content to render when index is not the last element */
                              <div
                                key={avail.label}
                                className="w-[12px] h-[12px] flex items-center justify-center"
                                style={{
                                  color: "#5A6462",
                                }}
                              >
                                +
                              </div>
                            ),
                          ])}
                        </div>
                      </div>

                      <div className="h-full w-[15%] flex justify-center items-center ">
                        <div
                          className={`px-[8px]  justify-center  rounded-full flex items-center ${
                            selectedQuantitative === "txcosts_median"
                              ? "border-[1.5px]"
                              : "border-0"
                          } ${isMobile ? "w-[65px]" : "w-[75px]"}
                          ${passMedian ? "opacity-100" : "opacity-50"}`}
                          style={{
                            borderColor: !feeIndexSort[optIndex][item.chain[1]]
                              ? "gray"
                              : getGradientColor(
                                  Math.floor(
                                    (feeIndexSort[optIndex][item.chain[1]][
                                      showUsd ? 2 : 1
                                    ] /
                                      feeIndexSort[optIndex][
                                        Object.keys(feeIndexSort[optIndex])[
                                          Object.keys(feeIndexSort[optIndex])
                                            .length - 1
                                        ]
                                      ][showUsd ? 2 : 1]) *
                                      100,
                                  ),
                                ),
                          }}
                        >
                          {`${passMedian ? (showUsd ? "$" : "Ξ") : ""}`}
                          {passMedian
                            ? Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 0,
                              }).format(
                                feeData.chain_data[item.chain[1]]["hourly"]
                                  .txcosts_median.data[optIndex][
                                  showUsd ? 2 : 1
                                ],
                              )
                            : "N/A"}
                        </div>
                      </div>
                      <div
                        className={`h-full  flex justify-end items-center  ${
                          isMobile ? "w-[13.5%]" : "w-[12.5%]"
                        }`}
                      >
                        <div
                          className={`px-[8px] w-[75px] justify-center rounded-full flex items-center ${
                            selectedQuantitative === "txcosts_native_median"
                              ? "border-[1.5px]"
                              : "border-0"
                          } ${passTransfer ? "opacity-100" : "opacity-50"}`}
                          style={{
                            borderColor: !feeIndexSort[optIndex][item.chain[1]]
                              ? "gray"
                              : getGradientColor(
                                  Math.floor(
                                    (feeIndexSort[optIndex][item.chain[1]][
                                      showUsd ? 2 : 1
                                    ] /
                                      feeIndexSort[optIndex][
                                        Object.keys(feeIndexSort[optIndex])[
                                          Object.keys(feeIndexSort[optIndex])
                                            .length - 1
                                        ]
                                      ][showUsd ? 2 : 1]) *
                                      100,
                                  ),
                                ),
                          }}
                        >
                          {`${passTransfer ? (showUsd ? "$" : "Ξ") : ""}`}
                          {passTransfer
                            ? Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 0,
                              }).format(
                                feeData.chain_data[item.chain[1]]["hourly"][
                                  "txcosts_native_median"
                                ].data[optIndex][showUsd ? 2 : 1],
                              )
                            : "N/A"}
                        </div>
                      </div>
                      <div
                        className={`h-full  flex justify-end items-center mr-[12px]
                      ${isMobile ? "w-[15%]" : "w-[13%]"}`}
                      >
                        <div
                          className={`px-[8px] w-[75px] justify-center rounded-full flex items-center ${
                            selectedQuantitative === "txcosts_swap"
                              ? "border-[1.5px]"
                              : "border-0"
                          } ${passSwap ? "opacity-100" : "opacity-50"}`}
                          style={{
                            borderColor: !feeIndexSort[optIndex][item.chain[1]]
                              ? "gray"
                              : getGradientColor(
                                  Math.floor(
                                    (feeIndexSort[optIndex][item.chain[1]][
                                      showUsd ? 2 : 1
                                    ] /
                                      feeIndexSort[optIndex][
                                        Object.keys(feeIndexSort[optIndex])[
                                          Object.keys(feeIndexSort[optIndex])
                                            .length - 1
                                        ]
                                      ][showUsd ? 2 : 1]) *
                                      100,
                                  ),
                                ),
                          }}
                        >
                          {`${passSwap ? (showUsd ? "$" : "Ξ") : ""}`}
                          {passSwap
                            ? Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 0,
                              }).format(
                                feeData.chain_data[item.chain[1]]["hourly"][
                                  "txcosts_swap"
                                ].data[optIndex][showUsd ? 2 : 1],
                              )
                            : "N/A"}
                        </div>
                      </div>
                      <div className="relative flex items-center justify-end h-full space-x-[1px]">
                        {Array.from({ length: 24 }, (_, index) => (
                          <div
                            key={index.toString() + "circles"}
                            className="h-[34px] flex items-center justify-center cursor-pointer"
                            onMouseEnter={() => {
                              setHoverBarIndex(index);
                            }}
                            onMouseLeave={() => {
                              setHoverBarIndex(null);
                            }}
                            onClick={() => {
                              setSelectedBarIndex(index);
                            }}
                          >
                            <div
                              className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${
                                selectedBarIndex === index
                                  ? "scale-[160%]"
                                  : hoverBarIndex === index
                                  ? "scale-[120%] opacity-90"
                                  : "scale-100 opacity-50"
                              }`}
                              style={{
                                backgroundColor: !feeIndexSort[23 - index][
                                  item.chain[1]
                                ]
                                  ? "gray"
                                  : getGradientColor(
                                      Math.floor(
                                        feeIndexSort[23 - index][
                                          item.chain[1]
                                        ][3] * 100,
                                      ),
                                    ),
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                      <div className="absolute left-[99%]">
                        <div
                          className={`w-[22px] h-[22px] rounded-full ${
                            selectedChains[item.chain[1]]
                              ? " bg-white dark:bg-forest-1000 dark:hover:forest-800"
                              : " bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-50"
                          }`}
                        >
                          <Icon
                            icon="feather:check-circle"
                            className={`w-[22px] h-[22px] transition-all rounded-full hover:cursor-pointer ${
                              selectedChains[item.chain[1]]
                                ? "opacity-100 bg-white dark:bg-forest-1000 dark:hover:forest-800"
                                : "opacity-0 bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-50"
                            }`}
                            style={{
                              color: selectedChains[item.chain[1]]
                                ? undefined
                                : "#5A6462",
                            }}
                            onClick={() => {
                              setSelectedChains((prevState) => {
                                return {
                                  ...prevState,
                                  [item.chain[1]]: !prevState[item.chain[1]],
                                };
                              });
                            }}
                          />
                        </div>
                      </div>
                    </animated.div>
                  );
                })}
              </div>
            </div>
          </FeesHorizontalScrollContainer>
          {/* <Container className="fixed bottom-[20px] left-[15px] right-0 pl-[52px] z-50">
            <div className="w-[835px] mx-auto h-[54px] bg-[#1F2726] rounded-t-[30px] z-50" >
            </div>
          </Container> */}
          <OffScreenSlider>
            <SliderChart isOpen={isChartOpen} setIsOpen={setIsChartOpen} />
          </OffScreenSlider>
          <Footer />
        </div>
      )}
    </>
  );
}
