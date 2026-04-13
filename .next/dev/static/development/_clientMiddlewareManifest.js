self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon.ico|icons|sw.js|manifest.json).*))(\\\\.json)?[\\/#\\?]?$",
    "originalSource": "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()