import React from "react";
import RequestComposer from "../pages/home.page";
import FormStorm from "@/pages/apitester.page";
import NotFound from "@/pages/notfound.page";
import { pathConfig } from "./paths";
import { BiHome, BiLogIn, BiLogOut, BiOutline } from "react-icons/bi";
import { MdApi } from "react-icons/md";
import { AiOutlineCloudDownload } from "react-icons/ai";
import MockApi from "@/pages/mockapi.homepage";
import SiginPage from "@/pages/auth/sigin.auth.page";
import SignupPage from "@/pages/auth/sigup.auth.page";
import { mainRoutesType, sidebarRoutesType } from "@/types/routes.types";

export const mainRoutes: mainRoutesType[] = [
  //AUTHENTICATION ROUTES
  { path: pathConfig.SIGN_IN, element: SiginPage },
  { path: pathConfig.SIGN_OUT, element: SignupPage },

  //DASHBOARD ROUTES
  { path: pathConfig.HOME, element: RequestComposer },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.HOME, element: RequestComposer },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.HOME, element: RequestComposer },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.HOME, element: RequestComposer },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },
  { path: pathConfig.API_TESTER, element: FormStorm },
  { path: pathConfig.MOCK_API, element: MockApi },

  //UNKNOWN PATHS ROUTES
  { path: pathConfig.OUT, element: NotFound },
  { path: pathConfig.NOT_FOUND, element: NotFound },
];

export const sidebarRoutes: sidebarRoutesType[] = [
  { path: pathConfig.HOME, icon: BiHome },
  { path: pathConfig.API_TESTER, icon: MdApi },
  { path: pathConfig.MOCK_API, icon: AiOutlineCloudDownload },
  { path: pathConfig.SIGN_IN, icon: BiLogIn },
  { path: pathConfig.SIGN_OUT, icon: BiLogOut },
  { path: pathConfig.OUT, icon: BiOutline },
];
