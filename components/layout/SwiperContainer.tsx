"use client";
import React, { Suspense } from "react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import { useUIContext } from "@/contexts/UIContext";

import "@splidejs/splide/css";
import SwiperItems from "./SwiperItems";
import ShowLoading from "./ShowLoading";
import SwiperItem from "./SwiperItem";
import { LandingURL } from "@/lib/urls";
import useSWR from "swr";

export default function SwiperContainer({ ariaId }: { ariaId?: string }) {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<any>(LandingURL);
  const { isSidebarOpen } = useUIContext();

  // const [isDragging, setIsDragging] = React.useState(false);

  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div className="wrapper h-[145px] md:h-[183px] w-full">
      <Splide
        options={{
          gap: "15px",
          autoHeight: true,
          width: "100%",
          padding: {
            left: isMobile ? "30px" : "50px",
            right: isMobile ? "30px" : "50px",
          },
          breakpoints: {
            640: {
              perPage: 1,
            },
            900: {
              perPage: isSidebarOpen ? 1 : 2,
            },
            1100: {
              perPage: 2,
            },
            1250: {
              perPage: isSidebarOpen ? 2 : 3,
            },
            1450: {
              perPage: 3,
            },
            1600: {
              perPage: 3,
            },
            6000: {
              perPage: isSidebarOpen ? 3 : 4,
            },
          },
        }}
        aria-labelledby={ariaId}
        hasTrack={false}
        // onDrag={(e) => {
        //   setIsDragging(true);
        // }}
        // onDragged={(e) => {
        //   setIsDragging(false);
        // }}
      >
        <SplideTrack>
          {["txcount", "stables_mcap", "fees", "rent_paid"].map((metric_id) => (
            <SplideSlide key={metric_id}>
              <div
                className="group w-full chain relative"
                // style={{
                //   pointerEvents: isDragging ? "none" : "all",
                // }}
              >
                {/* <Suspense
              fallback={
                <div className="w-full h-[145px] md:h-[183px] rounded-[15px]">
                  <div
                    role="status"
                    className="flex items-center justify-center h-full w-full rounded-lg animate-pulse bg-forest-50 dark:bg-[#1F2726]"
                  >
                    <Icon
                      icon="feather:loading"
                      className="w-6 h-6 text-white z-10"
                    />
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              }
            >
              <SwiperItem metric_id={metric_id} landing={landing} />
            </Suspense> */}
                {landing ? (
                  <SwiperItem metric_id={metric_id} landing={landing} />
                ) : (
                  <div className="w-full h-[145px] md:h-[183px] rounded-[15px]">
                    <div
                      role="status"
                      className="flex items-center justify-center h-full w-full rounded-lg animate-pulse bg-forest-50 dark:bg-[#1F2726]"
                    >
                      <Icon
                        icon="feather:loading"
                        className="w-6 h-6 text-white z-10"
                      />
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            </SplideSlide>
          ))}
        </SplideTrack>

        <div className="splide__arrows -mt-8 md:-mt-0">
          <button className="splide__arrow splide__arrow--prev rounded-full text-forest-400 bg-white dark:bg-forest-700 ml-1 md:ml-3 !w-5 md:!w-8 !h-5 md:!h-8">
            <Icon
              icon="feather:chevron-right"
              className="w-3 h-3 md:w-6 md:h-6 z-50"
            />
          </button>
          <button className="splide__arrow splide__arrow--next rounded-full text-forest-400 bg-white dark:bg-forest-700 mr-1 md:mr-3 !w-5 md:!w-8 !h-5 md:!h-8">
            <Icon
              icon="feather:chevron-right"
              className="w-3 h-3 md:w-6 md:h-6 z-50"
            />
          </button>
        </div>
        <div className="splide__progress -mt-8">
          <div className="splide__progress__bar" />
        </div>
      </Splide>
    </div>
  );
}