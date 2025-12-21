import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./routing";

import enAbout from "../messages/en/about.json";
import enCommon from "../messages/en/common.json";
import enContact from "../messages/en/contact.json";
import enFooter from "../messages/en/footer.json";
import enFramework from "../messages/en/framework.json";
import enHome from "../messages/en/home.json";
import enInsights from "../messages/en/insights.json";
import enVideos from "../messages/en/videos.json";
import enCourses from "../messages/en/courses.json";
import enGlossary from "../messages/en/glossary.json";
import enCases from "../messages/en/cases.json";
import enDownloads from "../messages/en/downloads.json";
import enNav from "../messages/en/nav.json";
import enNotFound from "../messages/en/notFound.json";
import enPrivacy from "../messages/en/privacy.json";
import enPrograms from "../messages/en/programs.json";
import enRisk from "../messages/en/risk.json";
import enSeo from "../messages/en/seo.json";
import enSystem from "../messages/en/system.json";
import enTerms from "../messages/en/terms.json";
import enTools from "../messages/en/tools.json";
import enPlayer from "../messages/en/player.json";
import enDonate from "../messages/en/donate.json";
import enAdminSystem from "../messages/en/adminSystem.json";

import zhAbout from "../messages/zh/about.json";
import zhCommon from "../messages/zh/common.json";
import zhContact from "../messages/zh/contact.json";
import zhFooter from "../messages/zh/footer.json";
import zhFramework from "../messages/zh/framework.json";
import zhHome from "../messages/zh/home.json";
import zhInsights from "../messages/zh/insights.json";
import zhVideos from "../messages/zh/videos.json";
import zhCourses from "../messages/zh/courses.json";
import zhGlossary from "../messages/zh/glossary.json";
import zhCases from "../messages/zh/cases.json";
import zhDownloads from "../messages/zh/downloads.json";
import zhNav from "../messages/zh/nav.json";
import zhNotFound from "../messages/zh/notFound.json";
import zhPrivacy from "../messages/zh/privacy.json";
import zhPrograms from "../messages/zh/programs.json";
import zhRisk from "../messages/zh/risk.json";
import zhSeo from "../messages/zh/seo.json";
import zhSystem from "../messages/zh/system.json";
import zhTerms from "../messages/zh/terms.json";
import zhTools from "../messages/zh/tools.json";
import zhPlayer from "../messages/zh/player.json";
import zhDonate from "../messages/zh/donate.json";
import zhAdminSystem from "../messages/zh/adminSystem.json";

const messagesByLocale = {
  zh: {
    about: zhAbout,
    common: zhCommon,
    contact: zhContact,
    footer: zhFooter,
    framework: zhFramework,
    home: zhHome,
    insights: zhInsights,
    videos: zhVideos,
    courses: zhCourses,
    glossary: zhGlossary,
    cases: zhCases,
    downloads: zhDownloads,
    nav: zhNav,
    notFound: zhNotFound,
    privacy: zhPrivacy,
    programs: zhPrograms,
    risk: zhRisk,
    seo: zhSeo,
    system: zhSystem,
    terms: zhTerms,
    tools: zhTools,
    player: zhPlayer,
    donate: zhDonate,
    adminSystem: zhAdminSystem
  },
  en: {
    about: enAbout,
    common: enCommon,
    contact: enContact,
    footer: enFooter,
    framework: enFramework,
    home: enHome,
    insights: enInsights,
    videos: enVideos,
    courses: enCourses,
    glossary: enGlossary,
    cases: enCases,
    downloads: enDownloads,
    nav: enNav,
    notFound: enNotFound,
    privacy: enPrivacy,
    programs: enPrograms,
    risk: enRisk,
    seo: enSeo,
    system: enSystem,
    terms: enTerms,
    tools: enTools,
    player: enPlayer,
    donate: enDonate,
    adminSystem: enAdminSystem
  }
} as const;

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale && locales.includes(locale as (typeof locales)[number])
    ? (locale as (typeof locales)[number])
    : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: messagesByLocale[resolvedLocale]
  };
});
