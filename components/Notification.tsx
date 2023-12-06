"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSpring, animated, config, useTransition } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Markdown from "react-markdown";
import { useMediaQuery } from "usehooks-ts";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BASE_URL } from "@/lib/helpers";
import moment from "moment";

type AirtableRow = {
  id: string;
  body: string;
  desc: string;
  url?: string;
};

type NotificationType = {
  id: string;
  key: string;
};

const currentDateTime = new Date().getTime();

const Notification = () => {
  const [data, setData] = useState<Array<object> | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loadedMessages, setLoadedMessages] = useState<string[]>([]);
  const [circleStart, setCircleStart] = useState(false);
  const [currentURL, setCurrentURL] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string | null>(null);
  const [sessionArray, setSessionArray] = useState<NotificationType[] | null>(
    null,
  );
  const [openNotif, setOpenNotif] = useState(false);
  const mobileRef = useRef(null);

  const isMobile = useMediaQuery("(max-width: 767px)");
  const currentPath = usePathname();

  // function isoDateTimeToUnix(
  //   dateString: string,
  //   timeString: string,
  // ): number | null {
  //   if (typeof dateString !== "string" || typeof timeString !== "string") {
  //     console.error("Invalid date or time type");
  //     return null;
  //   }

  //   const dateParts = dateString.split("-").map(Number);
  //   const timeParts = timeString.split(":").map(Number);

  //   if (dateParts.length !== 3 || timeParts.length !== 3) {
  //     console.error("Invalid date or time length");
  //     return null;
  //   }

  //   // Create a JavaScript Date object with the parsed date and time, and set it to the local time zone
  //   const localDate = new Date(
  //     dateParts[0],
  //     dateParts[1] - 1, // Month is 0-based in JavaScript
  //     dateParts[2],
  //     timeParts[0],
  //     timeParts[1],
  //     timeParts[2],
  //   );

  //   // Get the Unix timestamp (milliseconds since January 1, 1970)
  //   const unixTimestamp = localDate.getTime();

  //   return unixTimestamp;
  // }

  useEffect(() => {
    setCurrentURL(window.location.href);
    setPathname(window.location.pathname);
    const storedArray = JSON.parse(
      window.sessionStorage.getItem("mySessionArray") || "[]",
    ) as NotificationType[];
    setSessionArray(storedArray);
  }, [currentPath]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(BASE_URL + "/api/notifications", {
          method: "GET",
        });
        const result = await response.json();

        setData(result.records);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  // useEffect(() => {
  //   // Attach event listener when the component mounts
  //   document.addEventListener("mousedown", handleClickOutside);

  //   // Detach event listener when the component unmounts
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  function DateEnabled(startTime, startDate, endTime, endDate) {
    const startDateTime = moment.utc(`${startDate}T${startTime}Z`).valueOf();
    const endDateTime = moment.utc(`${endDate}T${endTime}Z`).valueOf();

    if (endDateTime && startDateTime) {
      if (currentDateTime < endDateTime && currentDateTime > startDateTime) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  function urlEnabled(url) {
    let retValue = true;

    if (url !== "" && url[0] !== "all" && currentURL && pathname) {
      if (!(pathname === "/") && url[0] === "home") {
        if (!currentURL.includes(url[0])) {
          retValue = false;
        }
      } else if (!currentURL.includes(url[0]) && url[0] !== "home") {
        retValue = false;
      }
    }
    return retValue;
  }

  // const handleClickOutside = (event: MouseEvent) => {
  //   if (
  //     mobileRef.current &&
  //     "contains" in mobileRef.current &&
  //     !(mobileRef.current as Element).contains(event.target as Node)
  //   ) {
  //     setOpenNotif(false);
  //   }
  // };

  const addItemToArray = (newData: string) => {
    if (newData.trim() !== "") {
      const newItem: NotificationType = {
        id: "LoadedNotifications",
        key: newData,
      };

      setSessionArray((prevArray) => [...(prevArray || []), newItem]);
    }
  };

  const filteredData = useMemo(() => {
    const returnArray: AirtableRow[] = [];

    if (data && sessionArray) {
      Object.keys(data).forEach((item) => {
        let passingDate = DateEnabled(
          data[item]["fields"]["Start Time"],
          data[item]["fields"]["Start Date"],
          data[item]["fields"]["End Time"],
          data[item]["fields"]["End Date"],
        );
        let enabled = data[item]["fields"]["Status"] === "Enabled";
        let passingURL = urlEnabled(
          data[item]["fields"]["Display Page"]
            ? data[item]["fields"]["Display Page"]
            : "",
        );

        let prevLoaded = true;
        //defaults to true if we find a prevLoaded value we set false

        Object.keys(sessionArray).forEach((index) => {
          if (sessionArray[index].key === data[item].id) {
            prevLoaded = false;
          }
        });

        //Check if notification is enabled, available/current date range and selected url

        if (enabled && passingDate && passingURL && prevLoaded) {
          let newEntry: AirtableRow = {
            id: data[item]["id"],
            body: data[item]["fields"]["Body"],
            desc: data[item]["fields"]["Description"],
            url: data[item]["fields"]["URL"]
              ? data[item]["fields"]["URL"]
              : null,
          };

          returnArray.push(newEntry);
        }
      });
    }

    return returnArray;
  }, [data, currentURL]);

  const Items = useMemo(() => {
    if (!filteredData) {
      return null;
    }
    return (
      <>
        {filteredData.map((item, i) => {
          if (item.url) {
            return (
              <Link
                className={`flex border-b-white border-dotted w-full mt-[8px] hover:cursor-pointer ${
                  i >= filteredData.length - 1
                    ? "border-b-[0px] pb-1"
                    : "border-b-[1px] pb-0"
                }`}
                key={item.id}
                href={item.url}
              >
                <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[5px]">
                  <div className="h-[17px] font-bold text-[14px]">
                    {item.desc}
                  </div>
                  <div className="h-auto text-[12px] leading-[.75rem]">
                    <Markdown>{item.body}</Markdown>
                  </div>
                </div>
                <div className="w-[35px] pr-[20px] self-center">
                  <Icon icon="ci:chevron-right" />
                </div>
              </Link>
            );
          }

          return (
            <div
              key={item.id}
              className={`flex border-b-white border-dotted w-full mt-[8px]  ${
                i >= filteredData.length - 1
                  ? "border-b-[0px] pb-1"
                  : "border-b-[1px] pb-0"
              }`}
            >
              <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[5px]">
                <div className="h-[17px] font-bold text-[14px]">
                  {item.desc}
                </div>
                <div className="h-auto text-[12px] leading-[.75rem]">
                  <Markdown>{item.body}</Markdown>
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }, [filteredData]);

  return (
    <div className="relative">
      {filteredData && (
        <>
          {!isMobile ? (
            <div className="flex w-full relative z-[110]">
              <button
                className="hidden mb-[10px] lg:mb-0 md:flex items-center gap-x-[10px] overflow-hidden w-[478px] xl:w-[600px] h-[28px] rounded-full border-[1px] dark:border-forest-50 border-black bg-white dark:bg-forest-900 px-[7px] relative z-10"
                onClick={() => {
                  setOpenNotif(!openNotif);
                }}
              >
                <Image
                  src="/FiBell.svg"
                  width={16}
                  height={16}
                  alt="Bell image"
                  className="text-forest-900"
                />
                <p className="text-[12px] font-[500] ">Notification Center</p>
              </button>
              <div
                className={`absolute hidden mb-[10px] lg:mb-0 md:flex flex-col w-[478px] xl:w-[600px] top-0 dark:bg-forest-900 bg-forest-50 rounded-b-xl rounded-t-xl z-1 overflow-hidden transition-max-height ${
                  openNotif
                    ? "max-h-screen duration-300 ease-in-out"
                    : "max-h-0 duration-300 ease-in-out"
                }`}
                // style={{
                //   maxHeight: openNotif ? "fit-content duration-400 ease-in" : "0px duration-200 ease-out",
                // }}
              >
                <div className="h-[24px]"></div>
                <div>
                  {filteredData.length === 0 ? (
                    <div
                      className={`flex border-b-white border-dotted w-full mt-[8px]`}
                    >
                      <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[5px]">
                        <div className="h-[17px] font-semibold text-[15px]">
                          There are currently no notifications.
                        </div>
                        <div className="h-auto text-[12px] leading-[.75rem]"></div>
                      </div>
                    </div>
                  ) : (
                    Items
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`relative flex md:hidden mt-[2px] mr-10 justify-self-end hover:pointer cursor-pointer p-3 rounded-full ${
                  openNotif ? "dark:bg-forest-900 bg-forest-50 z-[110]" : ""
                }`}
                onClick={() => {
                  setOpenNotif(!openNotif);
                }}
              >
                {" "}
                <Image
                  src="/FiBell.svg"
                  alt="Bell image"
                  width={24}
                  height={24}
                />
              </div>

              <div
                className={`fixed top-[80px] left-0 w-full h-auto bg-forest-900 rounded-2xl transition-max-height overflow-hidden break-inside-avoid z-[110] ${
                  openNotif
                    ? "bg-blend-darken duration-300 ease-in-out z-[110]"
                    : "bg-blend-normal duration-300 ease-in-out z-50"
                }`}
                style={{
                  maxHeight: openNotif ? "100vh" : "0",
                }}
                ref={mobileRef}
              >
                <div className="flex flex-col w-full pl-[0px] py-[8px] gap-y-[5px]">
                  {filteredData.map((item, index) =>
                    item.url ? (
                      <Link
                        className={`flex border-b-white border-dotted w-full mt-[8px] hover:cursor-pointer ${
                          index < filteredData.length - 1
                            ? "border-b-[1px] pb-1"
                            : "border-b-[0px] pb-1"
                        }`}
                        key={item.id}
                        href={item.url}
                      >
                        <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[8px]">
                          <div className="h-[17px] font-bold text-[16px]">
                            {item.desc}
                          </div>
                          <div className="h-auto text-[14px] leading-snug">
                            <Markdown>{item.body}</Markdown>
                          </div>
                        </div>
                        <div className="w-[35px] pr-[20px] self-center">
                          <Icon icon="ci:chevron-right" />
                        </div>
                      </Link>
                    ) : (
                      <div
                        className={`flex border-b-white border-dotted w-full mt-[8px] ${
                          index < filteredData.length - 1
                            ? "border-b-[1px] pb-1"
                            : "border-b-[0px] pb-1"
                        }`}
                        key={item.id}
                      >
                        <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[8px] ">
                          <div className="h-[17px] font-bold text-[16px]">
                            {item.desc}
                          </div>
                          <div className="h-auto text-[14px] leading-[.75rem]">
                            <Markdown>{item.body}</Markdown>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
      {openNotif && (
        <div
          className="fixed inset-0 bg-black opacity-30 z-[100]"
          onClick={() => {
            setOpenNotif(false);
          }}
        />
      )}
    </div>
  );
};

export default Notification;
