
export type mainRoutesType = {
  path: string;
  element: any;
};
export type sidebarRoutesType = {
  path: string;
  icon: any;
};

type ApiResponse<T> = T extends string ? { message: T } : { data: T };

export type A =  ApiResponse<30>


