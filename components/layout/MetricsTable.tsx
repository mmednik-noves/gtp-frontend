import { AllChainsByKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useTransition, animated } from "@react-spring/web";
import { useUIContext } from "@/contexts/UIContext";
import { navigationItems } from "@/lib/navigation";
import { CorporateContactJsonLd } from "next-seo";

const MetricsTable = ({
  data,
  chains,
  selectedChains,
  setSelectedChains,
  metric_id,
  showEthereumMainnet,
  setShowEthereumMainnet,
  timeIntervalKey,
}: {
  data: any;
  chains: any;
  selectedChains: any;
  setSelectedChains: any;
  metric_id: string;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  timeIntervalKey: string;
}) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [maxVal, setMaxVal] = useState<number | null>(null);

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const { theme } = useTheme();

  const [showGwei, reversePerformer] = useMemo(() => {
    const item = navigationItems[1].options.find(
      (item) => item.key === metric_id,
    );

    return [item?.page?.showGwei, item?.page?.reversePerformer];
  }, [metric_id]);

  const { isSidebarOpen } = useUIContext();

  const changesKey = useMemo(() => {
    if (timeIntervalKey === "monthly") {
      return "changes_monthly";
    }

    return "changes";
  }, [timeIntervalKey]);

  const dataKey = useMemo(() => {
    if (!data) return;

    const sampleChainDataTypes = data[Object.keys(data)[0]].daily.types;

    if (sampleChainDataTypes.includes("usd")) {
      if (showUsd) {
        return sampleChainDataTypes.indexOf("usd");
      } else {
        return sampleChainDataTypes.indexOf("eth");
      }
    } else {
      return 1;
    }
  }, [data, showUsd]);

  const valueKey = useMemo(() => {
    if (!data) return;

    const sampleChainChangesTypes =
      data[Object.keys(data)[0]][changesKey].types;

    if (sampleChainChangesTypes.includes("usd")) {
      if (showUsd) {
        return sampleChainChangesTypes.indexOf("usd");
      } else {
        return sampleChainChangesTypes.indexOf("eth");
      }
    } else {
      return 0;
    }
  }, [changesKey, data, showUsd]);

  // set maxVal
  useEffect(() => {
    if (!data) return;

    setMaxVal(
      Math.max(
        ...Object.keys(data)
          .filter((chain) => chain !== "ethereum")
          .map((chain) => {
            return data[chain].daily.data[data[chain].daily.data.length - 1][
              dataKey
            ];
          }),
      ),
    );
  }, [data, dataKey, showUsd]);

  const rows = useCallback(() => {
    if (!data || maxVal === null) return [];
    return Object.keys(data)
      .filter(
        (chain) =>
          chain !== "ethereum" && Object.keys(AllChainsByKeys).includes(chain),
      )
      .map((chain: any) => {
        const lastVal =
          data[chain].daily.data[data[chain].daily.data.length - 1][dataKey];
        return {
          data: data[chain],
          chain: AllChainsByKeys[chain],
          lastVal: lastVal,
          barWidth: `${(Math.max(lastVal, 0) / maxVal) * 100}%`,
        };
      })
      .sort((a, b) => {
        // always show ethereum at the bottom
        if (a.chain.key === "ethereum") return 1;
        if (b.chain.key === "ethereum") return -1;

        // sort by last value in daily data array and keep unselected chains at the bottom in descending order
        if (reversePerformer) {
          if (selectedChains.includes(a.chain.key)) {
            if (selectedChains.includes(b.chain.key)) {
              return a.lastVal - b.lastVal;
            } else {
              return -1;
            }
          } else {
            if (selectedChains.includes(b.chain.key)) {
              return 1;
            } else {
              return a.lastVal - b.lastVal;
            }
          }
        } else {
          if (selectedChains.includes(a.chain.key)) {
            if (selectedChains.includes(b.chain.key)) {
              return b.lastVal - a.lastVal;
            } else {
              return -1;
            }
          } else {
            if (selectedChains.includes(b.chain.key)) {
              return 1;
            } else {
              return b.lastVal - a.lastVal;
            }
          }
        }
      });
  }, [data, maxVal, dataKey, reversePerformer, selectedChains]);

  let height = 0;
  const transitions = useTransition(
    rows().map((data) => ({
      ...data,
      y: (height += isMobile ? 44 : 59) - (isMobile ? 44 : 59),
      height: isMobile ? 44 : 59,
    })),
    {
      key: (d) => d.chain.key,
      from: { opacity: 0, height: 0 },
      leave: { opacity: 0, height: 0 },
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  function formatNumber(number: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e9) {
      if (Math.abs(number) >= 1e12) {
        return (number / 1e12).toFixed(2) + "T";
      } else if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(2) + "B";
      }
    } else if (Math.abs(number) >= 1e6) {
      return (number / 1e6).toFixed(2) + "M";
    } else if (Math.abs(number) >= 1e3) {
      const rounded = (number / 1e3).toFixed(2);
      return `${rounded}${Math.abs(number) >= 10000 ? "K" : "K"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(2);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(2);
    } else {
      return number.toFixed(2);
    }

    // Default return if none of the conditions are met
    return "";
  }

  const getDisplayValue = useCallback(
    (item: any) => {
      let prefix = "";
      let suffix = "";
      let value = formatNumber(
        item.data.daily.data[item.data.daily.data.length - 1][1],
      );

      if (item.data.daily.types.includes("eth")) {
        if (!showUsd) {
          prefix = "Ξ";

          value = formatNumber(
            item.data.daily.data[item.data.daily.data.length - 1][
              item.data.daily.types.indexOf("eth")
            ],
          );

          let navItem = navigationItems[1].options.find(
            (item) => item.key === metric_id,
          );

          if (navItem && navItem.page?.showGwei) {
            prefix = "";
            suffix = " Gwei";
            value = formatNumber(
              item.data.daily.data[item.data.daily.data.length - 1][
                item.data.daily.types.indexOf("eth")
              ] * 1000000000,
            );
          }
        } else {
          prefix = "$";
          value = formatNumber(
            item.data.daily.data[item.data.daily.data.length - 1][
              item.data.daily.types.indexOf("usd")
            ],
          );
        }
      }
      return { value, prefix, suffix };
    },
    [metric_id, showUsd],
  );

  const timespanLabels = {
    "1d": "24h",
    "7d": "7 days",
    "30d": "30 days",
    "365d": "1 year",
  };

  const timespanLabelsMonthly = {
    "30d": "1 month",
    "90d": "3 months",
    "180d": "6 months",
    "365d": "1 year",
  };

  return (
    <div className="flex flex-col mt-3 md:mt-0 ml-0 lg:-ml-2 font-semibold space-y-[5px] overflow-x-scroll md:overflow-x-visible z-100 w-full py-5 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller">
      <div className="min-w-[570px] md:min-w-[600px] lg:min-w-full pr-[20px] md:pr-[50px] lg:pr-2 w-full">
        <div
          className={`flex items-center justify-between py-1 pl-4 pr-7 lg:pl-2 lg:pr-12 rounded-full font-semibold whitespace-nowrap text-xs lg:text-sm lg:mt-4`}
        >
          <div
            className={`${
              isSidebarOpen ? "w-1/4 2xl:w-1/3" : "w-1/3"
            } pl-[44px] lg:pl-[52px]`}
          >
            Yesterday
          </div>
          <div
            className={`${
              isSidebarOpen ? "w-3/4 2xl:w-2/3" : "w-2/3"
            } flex pr-7 lg:pr-4`}
          >
            {/* <div className={`w-1/5 text-right capitalize`}>
              Current
            </div> */}
            {Object.entries(
              timeIntervalKey === "monthly"
                ? timespanLabelsMonthly
                : timespanLabels,
            ).map(([timespan, label]) => (
              <div
                key={timespan}
                className={`text-right ${
                  isSidebarOpen ? "w-1/3 2xl:w-1/4" : "w-1/4"
                }
                ${
                  isSidebarOpen && (timespan === "7d" || timespan === "90d")
                    ? "hidden 2xl:block"
                    : "block"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        {/* <div
          className="h-auto overflow-y-hidden lg:h-[426px] lg:overflow-y-scroll overflow-x-visible relative  scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"
          style={{
            direction: "rtl",
          }}
        > */}
        <div
          className="lg:max-h-[381px] overflow-x-visible lg:overflow-y-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pr-8"
          style={{ direction: "ltr" }}
        >
          <div
            className="w-full relative"
            style={{ height: height, direction: "ltr" }}
            // style={{ height: height, direction: "ltr" }}
          >
            {transitions((style, item, t, index) => (
              <animated.div
                className="absolute w-full"
                style={{ zIndex: Object.keys(data).length - index, ...style }}
              >
                <div
                  key={item.chain.key}
                  className={`flex items-center justify-between cursor-pointer p-1.5 pl-4 py-[4px] lg:pr-2 lg:py-[10.5px] lg:pl-2 rounded-full w-full font-[400] border-[1px] whitespace-nowrap text-xs lg:text-[0.95rem] group relative
              ${
                item.chain.key === "ethereum"
                  ? showEthereumMainnet
                    ? "border-black/[16%] dark:border-[#5A6462] hover:border hover:p-1.5 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px] hover:lg:p-3 hover:lg:py-[7px]"
                    : "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/5 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px]"
                  : selectedChains.includes(item.chain.key)
                  ? "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/10"
                  : "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/5 transition-all duration-100"
              } `}
                  onClick={() => {
                    if (item.chain.key === "ethereum") {
                      if (showEthereumMainnet) {
                        setShowEthereumMainnet(false);
                      } else {
                        setShowEthereumMainnet(true);
                      }
                    } else {
                      if (selectedChains.includes(item.chain.key)) {
                        setSelectedChains(
                          selectedChains.filter((c) => c !== item.chain.key),
                        );
                      } else {
                        setSelectedChains([...selectedChains, item.chain.key]);
                      }
                    }
                  }}
                >
                  <div className="w-full h-full absolute left-0 bottom-0 rounded-full overflow-clip">
                    <div className="relative w-full h-full">
                      {item.chain.key !== "ethereum" && (
                        <>
                          <div
                            className={`absolute left-[15px] right-[15px] lg:left-[18px] lg:right-[18px] bottom-[0px] h-[1px] lg:h-[2px] rounded-none font-semibold transition-width duration-300 `}
                            style={{
                              background: selectedChains.includes(
                                item.chain.key,
                              )
                                ? item.chain.colors[theme ?? "dark"][1]
                                : "#5A6462",
                              width: item.barWidth,
                            }}
                          ></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex ${
                      isSidebarOpen ? "w-1/4 2xl:w-1/3" : "w-1/3"
                    } items-center pl-[44px] lg:pl-[52px]`}
                    style={{
                      color: selectedChains.includes(item.chain.key)
                        ? undefined
                        : "#5A6462",
                    }}
                  >
                    {/* <div
                      className={`w-[34px] h-[29px] rounded-full ${
                        item.chain.border[theme ?? "dark"][1]
                      } ${selectedChains.includes(item.chain.key) ? "" : ""}`}
                    ></div> */}
                    <Icon
                      icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                      className="absolute left-[12px] lg:left-[17px] w-[29px] h-[29px]"
                      style={{
                        color: selectedChains.includes(item.chain.key)
                          ? item.chain.colors[theme ?? "dark"][1]
                          : "#5A6462",
                      }}
                    />
                    {/* <Icon
                      icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                      className="w-[29px] h-[29px]"
                      style={{
                        color: item.chain.colors[theme ?? "dark"][1],
                      }}
                    /> */}
                    <div className="flex-1 break-inside-avoid">
                      <div className="flex-1 flex flex-col">
                        <div className="flex w-full items-baseline text-sm font-bold leading-snug">
                          {/* {item.data.daily.types.includes("usd") && (
                          <> */}
                          {/* {showUsd ? (
                              <div className="text-[13px] font-normal">$</div>
                            ) : (
                              <div className="text-[13px] font-normal">Ξ</div>
                            )} */}
                          {getDisplayValue(item).prefix && (
                            <div className="text-[13px] font-normal mr-[1px] leading-snug">
                              {getDisplayValue(item).prefix}
                            </div>
                          )}
                          {/* </> */}
                          {/* )} */}
                          {/* {item.data.daily.types.includes("usd")
                          ? Intl.NumberFormat(undefined, {
                              notation: "compact",
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            }).format(
                              item.data.daily.data[
                                item.data.daily.data.length - 1
                              ][
                                !showUsd &&
                                item.data.daily.types.includes("usd")
                                  ? 2
                                  : 1
                              ],
                            )
                          : Intl.NumberFormat(undefined, {
                              notation: "compact",
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            }).format(
                              item.data.daily.data[
                                item.data.daily.data.length - 1
                              ][1],
                            )} */}
                          {getDisplayValue(item).value}
                          {getDisplayValue(item).suffix && (
                            <div className="text-[13px] font-normal ml-0.5 leading-snug">
                              {getDisplayValue(item).suffix}
                            </div>
                          )}
                        </div>
                        {/* <div className="relative w-full">
                        {item.chain.key !== "ethereum" && (
                          <>
                            <div className="absolute left-0 -top-[3px] w-full h-1 bg-black/10"></div>
                            <div
                              className={`absolute left-0 -top-[3px] h-1 bg-forest-900 dark:bg-forest-50 rounded-none font-semibold transition-width duration-300 `}
                              style={{
                                width: item.barWidth,
                              }}
                            ></div>
                          </>
                        )}
                      </div> */}
                        <div
                          className={`font-medium leading-snug text-ellipsis overflow-hidden ${
                            isSidebarOpen
                              ? "text-[10px] 2xl:text-xs"
                              : "text-xs"
                          }`}
                        >
                          {item.chain.label}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${
                      isSidebarOpen ? "w-3/4 2xl:w-2/3" : "w-2/3"
                    } flex pr-4 font-medium`}
                  >
                    {Object.keys(
                      timeIntervalKey === "monthly"
                        ? timespanLabelsMonthly
                        : timespanLabels,
                    ).map((timespan) => (
                      <div
                        key={timespan}
                        className={`text-right  
                      ${
                        isSidebarOpen
                          ? "w-1/3 text-sm 2xl:text-base 2xl:w-1/4"
                          : "w-1/4 text-base"
                      }
                      ${
                        isSidebarOpen &&
                        (timespan === "7d" || timespan === "90d")
                          ? "hidden 2xl:block"
                          : ""
                      }`}
                      >
                        {item.data[changesKey][timespan][valueKey] === null ? (
                          <span className="text-gray-500 text-center mx-4 inline-block">
                            —
                          </span>
                        ) : (
                          <>
                            {(reversePerformer ? -1.0 : 1.0) *
                              item.data[changesKey][timespan][valueKey] >=
                            0 ? (
                              <div
                                className={`text-[#45AA6F] dark:text-[#4CFF7E] ${
                                  Math.abs(
                                    item.data[changesKey][timespan][valueKey],
                                  ) >= 10
                                    ? "lg:text-[13px] lg:font-[550] 2xl:text-[14px] 2xl:font-[600]"
                                    : ""
                                }`}
                                style={{
                                  color: selectedChains.includes(item.chain.key)
                                    ? undefined
                                    : "#5A6462",
                                }}
                              >
                                {reversePerformer ? "-" : "+"}
                                {(() => {
                                  const rawPercentage = Math.abs(
                                    Math.round(
                                      item.data[changesKey][timespan][
                                        valueKey
                                      ] * 1000,
                                    ) / 10,
                                  ).toFixed(1);

                                  const percentage = parseFloat(rawPercentage);

                                  if (!isNaN(percentage)) {
                                    // if (Math.abs(percentage) >= 1000)
                                    //   return formatNumber(percentage);

                                    const formattedPercentage =
                                      percentage.toFixed(1);

                                    return formattedPercentage.length >= 4
                                      ? Math.floor(percentage)
                                      : formattedPercentage;
                                  } else {
                                    return "Invalid Percentage";
                                  }
                                })()}
                                %
                              </div>
                            ) : (
                              <div
                                className={`text-[#DD3408] dark:text-[#FF3838] ${
                                  Math.abs(
                                    item.data[changesKey][timespan][valueKey],
                                  ) >= 10
                                    ? "lg:text-[13px] lg:font-[550]  2xl:text-[14px] 2xl:font-[600]"
                                    : ""
                                }`}
                                style={{
                                  color: selectedChains.includes(item.chain.key)
                                    ? undefined
                                    : "#5A6462",
                                }}
                              >
                                {reversePerformer ? "+" : "-"}
                                {
                                  // Math.abs(item.data[changesKey][timespan][0]) >= 10
                                  //   ? formatNumber(
                                  //       Math.abs(
                                  //         Math.round(
                                  //           item.data[changesKey][timespan][0] * 1000,
                                  //         ) / 10,
                                  //       ),
                                  //     )
                                  //   :
                                  Math.abs(
                                    Math.round(
                                      item.data[changesKey][timespan][
                                        valueKey
                                      ] * 1000,
                                    ) / 10,
                                  ).toFixed(1)
                                }
                                %
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    className={`absolute  ${
                      item.chain.key === "ethereum"
                        ? showEthereumMainnet
                          ? "-right-[19px] group-hover:-right-[20px]"
                          : "-right-[19px]"
                        : "-right-[20px]"
                    }`}
                  >
                    <div
                      className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        color: selectedChains.includes(item.chain.key)
                          ? undefined
                          : "#5A6462",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`w-6 h-6 ${
                          item.chain.key === "ethereum"
                            ? showEthereumMainnet
                              ? "opacity-0"
                              : "opacity-100"
                            : selectedChains.includes(item.chain.key)
                            ? "opacity-0"
                            : "opacity-100"
                        }`}
                      >
                        <circle
                          xmlns="http://www.w3.org/2000/svg"
                          cx="12"
                          cy="12"
                          r="10"
                        />
                      </svg>
                    </div>
                    <div
                      className={`p-1 rounded-full ${
                        selectedChains.includes(item.chain.key)
                          ? "bg-white dark:bg-forest-1000"
                          : "bg-forest-50 dark:bg-[#1F2726]"
                      }`}
                    >
                      <Icon
                        icon="feather:check-circle"
                        className={`w-6 h-6 ${
                          item.chain.key === "ethereum"
                            ? showEthereumMainnet
                              ? "opacity-100"
                              : "opacity-0"
                            : selectedChains.includes(item.chain.key)
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        style={{
                          color: selectedChains.includes(item.chain.key)
                            ? undefined
                            : "#5A6462",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </animated.div>
            ))}
          </div>
        </div>
        {/* </div> */}
      </div>
    </div>
  );
};

export default MetricsTable;
