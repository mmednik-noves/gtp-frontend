import Home from "@/components/home/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Growing Ethereum’s Ecosystem Together - Layer 2 User Base",
  description:
    "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
};

export default function Page() {
  return <Home />;
}
