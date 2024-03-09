import React, { useState, useRef } from "react";
import Parse from "parse";
import { jwtDecode } from "jwt-decode";
import { useScript } from "../hook/useScript";
import ModalUi from "../primitives/ModalUi";
import { modalCancelBtnColor, modalSubmitBtnColor } from "../constant/const";

/*
 * `GoogleSignInBtn`as it's name indicates it render google sign in button
 * and in this `useScript` in which we have created for generate google sign button
 * and when user click on sign in with google it will be verify on server side
 * and then generate token
 */
const GoogleSignInBtn = ({
  GoogleCred,
  thirdpartyLoginfn,
  thirdpartyLoader,
  setThirdpartyLoader
}) => {
  const [isModal, setIsModal] = useState(false);
  const googleBtn = useRef();
  const [userDetails, setUserDetails] = useState({
    Phone: "",
    Company: "",
    Name: "",
    Email: "",
    Destination: ""
  });
  const [googleDetails, setGoogleDetails] = useState({
    Id: "",
    TokenId: "",
    Gmail: "",
    Name: ""
  });
  useScript("https://accounts.google.com/gsi/client", () => {
    window.google.accounts.id.initialize({
      client_id: GoogleCred,
      callback: responseGoogle,
      auto_select: false
    });
    window.google.accounts.id.renderButton(googleBtn.current, {
      theme: "outline",
      size: "large",
      width: "187px"
    });
  });
  const clearStorage = async () => {
    if (Parse.User.current()) {
      await Parse.User.logOut();
    }
    let baseUrl = localStorage.getItem("baseUrl");
    let appid = localStorage.getItem("parseAppId");
    let applogo = localStorage.getItem("appLogo");
    let domain = localStorage.getItem("domain");
    let appversion = localStorage.getItem("appVersion");
    let appTitle = localStorage.getItem("appTitle");
    let defaultmenuid = localStorage.getItem("defaultmenuid");
    let PageLanding = localStorage.getItem("PageLanding");
    let _appName = localStorage.getItem("_appName");
    let _app_objectId = localStorage.getItem("_app_objectId");
    let appName = localStorage.getItem("appName");
    let userSettings = localStorage.getItem("userSettings");

    localStorage.clear();

    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
    localStorage.setItem("appLogo", applogo);
    localStorage.setItem("domain", domain);
    localStorage.setItem("appversion", appversion);
    localStorage.setItem("appTitle", appTitle);
    localStorage.setItem("defaultmenuid", defaultmenuid);
    localStorage.setItem("PageLanding", PageLanding);
    localStorage.setItem("_appName", _appName);
    localStorage.setItem("_app_objectId", _app_objectId);
    localStorage.setItem("appName", appName);
    localStorage.setItem("userSettings", userSettings);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
  };
  const responseGoogle = async (response) => {
    clearStorage();
    setThirdpartyLoader(true);
    // console.log("response ", response);
    if (response.credential) {
      const data = jwtDecode(response.credential);
      // console.log("data ", data);
      if (data.sub && data.email) {
        const details = {
          Email: data.email,
          Name: data.name
        };
        setUserDetails({ ...userDetails, ...details });
        const Gdetails = {
          Id: data.sub,
          TokenId: response.credential,
          Gmail: data.email,
          Name: data.name
        };
        setGoogleDetails({ ...googleDetails, ...Gdetails });
        await checkExtUser(Gdetails);
      }
    }
  };
  const checkExtUser = async (details) => {
    // const extUser = new Parse.Query("contracts_Users");
    // extUser.equalTo("Email", details.Gmail);
    // const extRes = await extUser.first();
    const params = { email: details.Gmail };
    const extRes = await Parse.Cloud.run("getUserDetails", params);
    // console.log("extRes ", extRes);
    if (extRes) {
      const params = { ...details, Phone: extRes.get("Phone") };
      const payload = await Parse.Cloud.run("googlesign", params);
      // console.log("payload ", payload);
      if (payload && payload.sessiontoken) {
        // setThirdpartyLoader(true);
        const billingDate =
          extRes.get("Next_billing_date") && extRes.get("Next_billing_date");
        // console.log("billingDate expired", billingDate > new Date());
        const LocalUserDetails = {
          name: details.Name,
          email: details.Gmail,
          phone: extRes.get("Phone"),
          company: extRes.get("Company")
        };
        localStorage.setItem("userDetails", JSON.stringify(LocalUserDetails));
        thirdpartyLoginfn(payload.sessiontoken, billingDate);
      }
      return { msg: "exist" };
    } else {
      setIsModal(true);
      setThirdpartyLoader(false);
      return { msg: "notexist" };
    }
  };
  const handleSubmitbtn = async () => {
    if (userDetails.Phone && userDetails.Company) {
      setThirdpartyLoader(true);
      // e.preventDefault()
      // console.log("handelSubmit", userDetails);
      const params = { ...googleDetails, Phone: userDetails.Phone };
      const payload = await Parse.Cloud.run("googlesign", params);

      // console.log("payload ", payload);
      if (payload && payload.sessiontoken) {
        const params = {
          userDetails: {
            name: userDetails.Name,
            email: userDetails.Email,
            // "passsword":userDetails.Phone,
            phone: userDetails.Phone,
            role: "contracts_User",
            company: userDetails.Company,
            jobTitle: userDetails.Destination
          }
        };
        const userSignUp = await Parse.Cloud.run("usersignup", params);
        // console.log("userSignUp ", userSignUp);
        if (userSignUp && userSignUp.sessionToken) {
          const LocalUserDetails = {
            name: userDetails.Name,
            email: userDetails.Email,
            phone: userDetails.Phone,
            company: userDetails.Company
            // jobTitle: userDetails.JobTitle
          };
          localStorage.setItem("userDetails", JSON.stringify(LocalUserDetails));
          thirdpartyLoginfn(userSignUp.sessionToken);
        } else {
          alert(userSignUp.message);
        }
      } else if (
        payload &&
        payload.message.replace(/ /g, "_") === "Internal_server_err"
      ) {
        alert("Internal server error !");
      }
    } else {
      alert("Please fill required details!");
    }
  };
  const handleCloseModal = () => {
    setIsModal(false);
    Parse.User.logOut();

    let appdata = localStorage.getItem("userSettings");
    let applogo = localStorage.getItem("appLogo");
    let appName = localStorage.getItem("appName");
    let defaultmenuid = localStorage.getItem("defaultmenuid");
    let PageLanding = localStorage.getItem("PageLanding");
    let domain = localStorage.getItem("domain");
    let _appName = localStorage.getItem("_appName");
    let baseUrl = localStorage.getItem("baseUrl");
    let appid = localStorage.getItem("parseAppId");

    localStorage.clear();

    localStorage.setItem("appLogo", applogo);
    localStorage.setItem("appName", appName);
    localStorage.setItem("_appName", _appName);
    localStorage.setItem("defaultmenuid", defaultmenuid);
    localStorage.setItem("PageLanding", PageLanding);
    localStorage.setItem("domain", domain);
    localStorage.setItem("userSettings", appdata);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
  };
  return (
    <div style={{ position: "relative" }}>
      {thirdpartyLoader && (
        <div
          style={{
            position: "fixed",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.2)",
            top: 0,
            left: 0,
            zIndex: 2
          }}
        >
          <div
            style={{
              position: "fixed",
              fontSize: "50px",
              color: "#3ac9d6",
              top: "50%",
              left: "45%"
            }}
            className="loader-37"
          ></div>
        </div>
      )}
      <div ref={googleBtn} className="text-sm"></div>
      <ModalUi showClose={false} isOpen={isModal} title="Sign up form">
        <form className="px-4 py-3">
          <div className="mb-3">
            <label
              htmlFor="Phone"
              style={{ display: "flex" }}
              className="block text-xs text-gray-700 font-semibold"
            >
              Phone <span style={{ fontSize: 13, color: "red" }}>*</span>
            </label>
            <input
              type="tel"
              className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
              id="Phone"
              value={userDetails.Phone}
              onChange={(e) =>
                setUserDetails({
                  ...userDetails,
                  Phone: e.target.value
                })
              }
              required
            />
          </div>
          <div className="mb-3">
            <label
              htmlFor="Company"
              style={{ display: "flex" }}
              className="block text-xs text-gray-700 font-semibold"
            >
              Company <span style={{ fontSize: 13, color: "red" }}>*</span>
            </label>
            <input
              type="text"
              className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
              id="Company"
              value={userDetails.Company}
              onChange={(e) =>
                setUserDetails({
                  ...userDetails,
                  Company: e.target.value
                })
              }
              required
            />
          </div>
          <div className="mb-3">
            <label
              htmlFor="JobTitle"
              style={{ display: "flex" }}
              className="block text-xs text-gray-700 font-semibold"
            >
              Job Title <span style={{ fontSize: 13, color: "red" }}>*</span>
            </label>
            <input
              type="text"
              className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
              id="JobTitle"
              value={userDetails.Destination}
              onChange={(e) =>
                setUserDetails({
                  ...userDetails,
                  Destination: e.target.value
                })
              }
              required
            />
          </div>
          <div>
            <button
              type="button"
              className="px-3 py-1.5 text-white rounded shadow-md text-center focus:outline-none "
              onClick={() => handleSubmitbtn()}
              style={{ marginRight: 10, backgroundColor: modalSubmitBtnColor }}
            >
              Sign up
            </button>
            <button
              type="button"
              className="p-1.5 text-black border-[1px] border-[#ccc] shadow-md rounded focus:outline-none"
              onClick={handleCloseModal}
              style={{ width: 90, backgroundColor: modalCancelBtnColor }}
            >
              Cancel
            </button>
          </div>
        </form>
      </ModalUi>
    </div>
  );
};

export default GoogleSignInBtn;
