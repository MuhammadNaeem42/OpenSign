import Parse from "parse";
import axios from "axios";
import { appInfo } from "../../constant/appinfo";

//For fetching application Information
export const fetchAppInfo = () => async (dispatch) => {
  localStorage.setItem("_appName", appInfo.appname);
  localStorage.setItem("_app_objectId", appInfo.objectId);
  localStorage.setItem("baseUrl", `${appInfo.baseUrl}/`);
  localStorage.setItem("parseAppId", appInfo.appId);
  localStorage.setItem("appLogo", appInfo.applogo);
  localStorage.setItem("appVersion", appInfo.version);
  localStorage.removeItem("userSettings");
  localStorage.setItem("userSettings", JSON.stringify(appInfo.settings));
  localStorage.setItem("appTitle", appInfo.appTitle);
  localStorage.setItem("fev_Icon", appInfo.fev_Icon);
  // console.log("response ", response);
  dispatch({ type: "FATCH_APPINFO", payload: appInfo });
};

//for simple login
export const login = (username, password) => async (dispatch) => {
  let res = {};
  let baseUrl = localStorage.getItem("baseUrl");
  let parseAppId = localStorage.getItem("parseAppId");
  try {
    await Parse.User.logIn(username, password).then(
      async function (res1) {
        var resultjson = res1.toJSON();
        res = res1.toJSON();
        localStorage.setItem("userEmail", username);
        localStorage.setItem("username", resultjson.name);
        localStorage.setItem("accesstoken", resultjson.sessionToken);
        localStorage.setItem("scriptId", true);
        if (resultjson.ProfilePic) {
          localStorage.setItem("profileImg", resultjson.ProfilePic);
        } else {
          localStorage.setItem("profileImg", "");
        }
        let url = `${baseUrl}functions/UserGroups`;
        const headers = {
          "Content-Type": "application/json",
          "X-Parse-Application-Id": parseAppId,
          sessionToken: resultjson.sessionToken
        };

        let body = {
          appname: localStorage.getItem("domain")
        };
        let userGroup = "",
          userGroup1 = "";
        await axios
          .post(url, JSON.stringify(body), { headers: headers })
          .then(async (response) => {
            userGroup = response.data.result[0];
            userGroup1 = response.data.result[1];
            localStorage.setItem("_userGroup", userGroup);
          });

        let appSetings = JSON.parse(localStorage.getItem("userSettings"));
        let defaultmenuid = "",
          PageLanding = "",
          pageType = "";

        appSetings.forEach(async (element) => {
          if (`${localStorage.getItem("_appName")}_appeditor` === userGroup) {
            if (element.role === userGroup1) {
              defaultmenuid = element.menuId;
              PageLanding = element.pageId;
              pageType = element.pageType;
              localStorage.setItem("PageLanding", PageLanding);
              localStorage.setItem("defaultmenuid", defaultmenuid);
              localStorage.setItem("pageType", pageType);
              let _role = userGroup1.replace(
                `${localStorage.getItem("_appName")}_`,
                ""
              );
              if (userGroup1) {
                localStorage.setItem("_user_role", _role);
              } else {
                localStorage.setItem("_user_role", _role);
              }
            }
          } else if (element.role === userGroup) {
            defaultmenuid = element.menuId;
            PageLanding = element.pageId;
            pageType = element.pageType;
            localStorage.setItem("PageLanding", PageLanding);
            localStorage.setItem("defaultmenuid", defaultmenuid);
            localStorage.setItem("pageType", pageType);
            localStorage.setItem("extended_class", element.extended_class);
            let _role = userGroup.replace(
              `${localStorage.getItem("domain")}_`,
              ""
            );
            if (userGroup) {
              localStorage.setItem("_user_role", _role);
            } else {
              localStorage.setItem("_user_role", _role);
            }
            try {
              const currentUser = Parse.User.current();
              await Parse.Cloud.run("getUserDetails", {
                email: currentUser.get("email")
              }).then(
                (results) => {
                  let userinfo = results.toJSON();
                  if (userinfo.TenantId) {
                    localStorage.setItem("TenetId", userinfo.TenantId.objectId);
                  }
                  //  console.log("tour found", results);
                },
                (error) => {
                  console.error("Error while fetching tour", error);
                }
              );
            } catch (error) {
              console.log("err ", error);
            }
          }
        });

        dispatch({ type: "APP_LOGIN", payload: res });

        if (pageType !== "") {
          window.location = `/${pageType}/${PageLanding}`;
        } else {
          alert("You dont have access to this application.");
          localStorage.setItem("accesstoken", null);
        }
      },
      function () {
        alert("Invalid Login");
        localStorage.setItem("accesstoken", null);
      }
    );
  } catch (err) {
    console.log(err);
    alert("You dont have access to this application.");
    localStorage.setItem("accesstoken", null);
  }
};

//for reset password
export const forgetPassword = (username) => async () => {
  try {
    await Parse.User.requestPasswordReset(username).then(
      async function (res1) {
        // var resultjson = res1;
        // console.log("post data", resultjson.length);
        if (res1.data === undefined) {
          alert("Reset password link has been sent to your email id ");
        }
      },
      function () {
        // alert("Password Reset Done")
      }
    );
  } catch (err) {
    console.log(err);
  }
};

// Role field wizard
export const fetchRoleEnum = (name) => async (dispatch) => {
  let response = [];
  let baseUrl = localStorage.getItem("baseUrl");
  let parseAppId = localStorage.getItem("parseAppId");
  try {
    let url = `${baseUrl}roles?where={"name":{"$regex":"${name}","$ne":"${localStorage.getItem(
      "domain"
    )}_appeditor"}}`;
    const headers = {
      "Content-Type": "application/json",
      "X-Parse-Application-Id": parseAppId
    };
    await axios.get(url, { headers: headers }).then((res) => {
      let temp = [];
      res.data.results.forEach((x) => {
        temp.push(x["name"]);
      });
      response = temp;
    });
  } catch (e) {
    console.error("Problem", e);
  }
  dispatch({ type: "FETCH_ROLE", payload: response });
};

export const showTenantName = (name) => async (dispatch) => {
  dispatch({ type: "SHOW_TENANT", payload: name || null });
};

export const save_tourSteps = (steps) => async (dispatch) => {
  dispatch({ type: "SAVE_TOURSTEPS", payload: steps });
};

export const remove_tourSteps = () => async (dispatch) => {
  dispatch({ type: "REMOVE_TOURSTEPS", payload: [] });
};
