import React, { useEffect, useState, useRef } from "react";
import "../styles/opensigndrive.css";
import loader from "../assets/images/loader2.gif";
import DriveBody from "../components/opensigndrive/DriveBody";
import { themeColor, iconColor } from "../constant/const";
import { getDrive } from "../constant/Utils";
import { useNavigate } from "react-router-dom";
import Title from "../components/Title";
import Parse from "parse";
import ModalUi from "../primitives/ModalUi";

function Opensigndrive() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [isList, setIsList] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Date");
  const [sortingOrder, setSortingOrder] = useState("Decending");
  const [pdfData, setPdfData] = useState([]);
  const [isFolder, setIsFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState();
  const [error, setError] = useState();
  const [folderLoader, setIsFolderLoader] = useState(false);
  const [isShowSort, setIsShowSort] = useState(false);
  const [isLoading, setIsLoading] = useState({
    isLoad: true,
    message: "This might take some time"
  });
  const [docId, setDocId] = useState();
  const [handleError, setHandleError] = useState("");
  const [folderName, setFolderName] = useState([]);
  const [isAlert, setIsAlert] = useState({ isShow: false, alertMessage: "" });
  const [isNewFol, setIsNewFol] = useState(false);
  const currentUser =
    localStorage.getItem(
      `Parse/${localStorage.getItem("parseAppId")}/currentUser`
    ) &&
    localStorage.getItem(
      `Parse/${localStorage.getItem("parseAppId")}/currentUser`
    );
  const jsonCurrentUser = JSON.parse(currentUser);

  useEffect(() => {
    if (docId) {
      getPdfFolderDocumentList();
    } else {
      getPdfDocumentList();
    }
    // eslint-disable-next-line
  }, [docId]);

  //function for get all pdf document list
  const getPdfDocumentList = async () => {
    const load = {
      isLoad: true,
      message: "This might take some time"
    };
    let driveDetails;
    setIsLoading(load);
    try {
      driveDetails = await getDrive();
      if (driveDetails) {
        if (driveDetails.length > 0) {
          setPdfData(driveDetails);
          sortApps(null, null, driveDetails);
        }
        const data = [
          {
            name: "OpenSign™ Drive",
            objectId: ""
          }
        ];
        setFolderName(data);
        const loadObj = {
          isLoad: false
        };
        setIsLoading(loadObj);
      } else if (driveDetails === "Error: Something went wrong!") {
        const loadObj = {
          isLoad: false
        };
        setHandleError("Error: Something went wrong!");
        setIsLoading(loadObj);
      }
    } catch (e) {
      setIsAlert({
        isShow: true,
        alertMessage: "something went wrong"
      });
    }
  };
  //function for get parent folder document list
  const getPdfFolderDocumentList = async () => {
    const load = {
      isLoad: true,
      message: "This might take some time"
    };
    setIsLoading(load);
    let driveDetails;
    try {
      driveDetails = await getDrive(docId);

      if (driveDetails) {
        if (driveDetails.length > 0) {
          setPdfData(driveDetails);
          sortApps(null, null, driveDetails);
        } else {
          setPdfData([]);
        }
        const loadObj = {
          isLoad: false
        };
        setIsLoading(loadObj);
      } else if (driveDetails === "Error: Something went wrong!") {
        const loadObj = {
          isLoad: false
        };
        setHandleError("Error: Something went wrong!");
        setIsLoading(loadObj);
      }
    } catch (e) {
      setIsAlert({
        isShow: true,
        alertMessage: "something went wrong!"
      });
    }
  };

  //function for get all pdf document list
  const getParentFolder = async () => {
    setIsFolder(true);
  };
  //function for handle folder name path
  const handleRoute = (index) => {
    const updateFolderName = folderName.filter((x, i) => {
      if (i <= index) {
        return x;
      }
    });

    setFolderName(updateFolderName);
    const getLastId = updateFolderName[updateFolderName.length - 1];
    setDocId(getLastId.objectId);
  };

  //function for add new folder name
  const handleFolderName = (e) => {
    setError();
    const value = e.target.value;
    setNewFolderName(value);
  };
  //function for create folder
  const handleAddFolder = async () => {
    if (newFolderName) {
      setIsFolderLoader(true);
      const getParentObjId = folderName[folderName.length - 1];
      const parentId = getParentObjId && getParentObjId.objectId;
      const foldercls = `${localStorage.getItem("_appName")}_Document`;
      const folderPtr = {
        __type: "Pointer",
        className: foldercls,
        objectId: parentId
      };
      const CreatedBy = {
        __type: "Pointer",
        className: "_User",
        objectId: jsonCurrentUser.objectId
      };

      try {
        const exsitQuery = new Parse.Query(foldercls);
        exsitQuery.equalTo("Name", newFolderName);
        exsitQuery.equalTo("Type", "Folder");
        if (parentId) {
          exsitQuery.equalTo("Folder", folderPtr);
        }
        const templExist = await exsitQuery.first();
        if (templExist) {
          setError("Folder already exist!");
          setIsFolderLoader(false);
        } else {
          const template = new Parse.Object(foldercls);
          template.set("Name", newFolderName);
          template.set("Type", "Folder");

          if (parentId) {
            template.set("Folder", folderPtr);
          }
          template.set("CreatedBy", CreatedBy);
          const res = await template.save();
          if (res) {
            const result = JSON.parse(JSON.stringify(res));

            setPdfData((prev) => [...prev, result]);
            setNewFolderName();
            setIsFolderLoader(false);
            setIsFolder(false);
          }
        }
      } catch (e) {
        setIsAlert({
          isShow: true,
          alertMessage: "something went wrong!"
        });
      }
    } else {
      setError("Please fill out this field");
    }
  };

  const sortingApp = (appInfo, type, order) => {
    if (type === "Name") {
      if (order === "Accending") {
        return appInfo.sort((a, b) => (a.Name > b.Name ? 1 : -1));
      } else if (order === "Decending") {
        return appInfo.sort((a, b) => (a.Name > b.Name ? -1 : 1));
      }
    } else if (type === "Date") {
      if (order === "Accending") {
        return appInfo.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
      } else if (order === "Decending") {
        return appInfo.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
      }
    }
  };

  const sortApps = (type, order, driveDetails) => {
    const selectedSortType = type ? type : selectedSort ? selectedSort : "Date";
    const sortOrder = order ? order : sortingOrder ? sortingOrder : "Decending";

    let sortingData = driveDetails;
    if (selectedSortType === "Name") {
      sortingApp(sortingData, "Name", sortOrder);
    } else if (selectedSortType === "Date") {
      sortingApp(sortingData, "Date", sortOrder);
    }

    setPdfData(sortingData);
  };

  //function for handle auto scroll on folder path
  const handleMouseEnter = (e) => {
    let side = "";
    const container = scrollRef.current;
    const containerRect = container.getBoundingClientRect();
    const cursorX = e.clientX;
    const containerX = containerRect.left;
    const containerWidth = containerRect.width;

    // Define a threshold (e.g., 10 pixels) for the start and end points
    const threshold = 10;

    if (cursorX - containerX <= threshold) {
      side = "start";
    } else if (containerX + containerWidth - cursorX <= threshold) {
      side = "end";
    } else {
      side = "";
    }

    const scrollSpeed = 10;
    let scrollAmount = 0;

    const scroll = () => {
      if (side === "start" && container.scrollLeft > 0) {
        container.scrollLeft -= scrollAmount;
        requestAnimationFrame(scroll);
      } else if (
        side === "end" &&
        container.scrollLeft < container.scrollWidth - container.clientWidth
      ) {
        container.scrollLeft += scrollAmount;
        requestAnimationFrame(scroll);
      }
    };

    container.addEventListener("mousemove", (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const containerWidth = rect.width;

      // Calculate the scroll amount based on the cursor's position
      scrollAmount = (x / containerWidth) * scrollSpeed;
    });

    scroll();
  };

  //handle to close drop down menu onclick screen
  useEffect(() => {
    const closeMenuOnOutsideClick = (e) => {
      if (isShowSort && !e.target.closest("#menu-container")) {
        setIsShowSort(!isShowSort);
      } else if (isNewFol && !e.target.closest("#folder-menu")) {
        setIsNewFol(!isNewFol);
      }
    };

    document.addEventListener("click", closeMenuOnOutsideClick);

    return () => {
      // Cleanup the event listener when the component unmounts
      document.removeEventListener("click", closeMenuOnOutsideClick);
    };
  }, [isShowSort, isNewFol]);

  const handleFolderTab = (folderData) => {
    return folderData.map((data, id) => {
      return (
        <React.Fragment key={id}>
          <span
            onClick={() => handleRoute(id)}
            style={{
              color: "#a64b4e",
              fontWeight: "400",
              cursor: "pointer"
            }}
          >
            {data.name}
            <span
              style={{
                color: "#a64b4e",
                fontWeight: "200",
                cursor: "pointer",
                margin: "0 4px"
              }}
            >
              &gt;
            </span>
          </span>
        </React.Fragment>
      );
    });
  };
  const oncloseFolder = () => {
    setIsFolder(false);
    setNewFolderName("");
    setError("");
  };
  return (
    <div style={{ backgroundColor: "white" }} className="folderComponent">
      <Title title={"OpenSign™ Drive"} drive={true} />
      <div>
        <ModalUi
          headerColor={"#dc3545"}
          isOpen={isAlert.isShow}
          title={"Alert"}
          handleClose={() => {
            setIsAlert({
              isShow: false,
              alertMessage: ""
            });
          }}
        >
          <div style={{ height: "100%", padding: 20 }}>
            <p>{isAlert.alertMessage}</p>

            <div
              style={{
                height: "1px",
                backgroundColor: "#9f9f9f",
                width: "100%",
                marginTop: "15px",
                marginBottom: "15px"
              }}
            ></div>
            <button
              onClick={() =>
                setIsAlert({
                  isShow: false,
                  alertMessage: ""
                })
              }
              type="button"
              className="finishBtn cancelBtn"
            >
              Close
            </button>
          </div>
        </ModalUi>
        <ModalUi
          isOpen={isFolder}
          title={"Add New Folder"}
          handleClose={oncloseFolder}
        >
          <div style={{ height: "100%", padding: 20 }}>
            {folderLoader ? (
              <div
                style={{
                  height: "200px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <img
                  alt="loader img"
                  src={loader}
                  style={{ width: "50px", height: "50px" }}
                />
                <span style={{ fontSize: "13px", color: "gray" }}>
                  Loading...
                </span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddFolder();
                }}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <label
                  style={{
                    margin: "10px 0px 10px 0px",
                    fontSize: "15px",
                    fontWeight: "400"
                  }}
                >
                  Name
                  <span style={{ color: "red" }}>*</span>
                </label>

                <input
                  required
                  className="form-control inputStyle"
                  type="text"
                  value={newFolderName}
                  onChange={(e) => handleFolderName(e)}
                  // className="addFolderInput"
                />
                <span
                  style={{ color: "red", fontSize: "12px", marginTop: "6px" }}
                >
                  {error}
                </span>
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "#9f9f9f",
                    width: "100%",
                    marginTop: "15px",
                    marginBottom: "15px"
                  }}
                ></div>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <button
                    style={{ background: themeColor }}
                    type="submit"
                    className="finishBtn"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="finishBtn cancelBtn"
                    onClick={oncloseFolder}
                  >
                    Close
                  </button>
                </div>
              </form>
            )}
          </div>
        </ModalUi>

        {isLoading.isLoad ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              width: "100%",
              flexDirection: "column"
            }}
          >
            <img
              alt="loader img"
              src={loader}
              style={{ width: "80px", height: "80px" }}
            />
            <span style={{ fontSize: "13px", color: "gray" }}>
              {isLoading.message}
            </span>
          </div>
        ) : handleError ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              width: "100%"
            }}
          >
            <span style={{ fontSize: "20px", color: "gray" }}>
              {handleError}
            </span>
          </div>
        ) : (
          <>
            <div className="folderContainer">
              <div
                onMouseEnter={(e) => handleMouseEnter(e)}
                ref={scrollRef}
                style={{
                  width: "100%"
                }}
                className="folderPath"
              >
                {handleFolderTab(folderName)}
              </div>
              <div className="dropMenuBD">
                <div
                  id="folder-menu"
                  className={
                    isNewFol ? "dropdown show dropDownStyle" : "dropdown"
                  }
                  onClick={() => setIsNewFol(!isNewFol)}
                >
                  <div className="sort">
                    <i
                      className="fa fa-plus-square"
                      aria-hidden="true"
                      style={{ fontSize: "25px", color: `${iconColor}` }}
                    ></i>
                  </div>
                  <div
                    className={
                      isNewFol ? "dropdown-menu show" : "dropdown-menu"
                    }
                    aria-labelledby="dropdownMenuButton"
                    aria-expanded={isNewFol ? "true" : "false"}
                  >
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <span
                        className="dropdown-item itemColor"
                        onClick={() => getParentFolder()}
                      >
                        <i
                          style={{ marginRight: "5px" }}
                          className="fa fa-plus"
                          aria-hidden="true"
                        ></i>
                        Create folder
                      </span>
                      <span
                        className="dropdown-item itemColor"
                        onClick={() => navigate("/form/sHAnZphf69")}
                      >
                        <i
                          style={{ marginRight: "5px" }}
                          className="fas fa-pen-nib"
                        ></i>
                        Sign Yourself
                      </span>
                      <span
                        className="dropdown-item itemColor"
                        onClick={() => navigate("/form/8mZzFxbG1z")}
                      >
                        {" "}
                        <i
                          style={{ marginRight: "5px" }}
                          className="fa fa-file-signature"
                        ></i>
                        Request Signatures{" "}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  id="menu-container"
                  className={isShowSort ? "dropdown show" : "dropdown"}
                  onClick={() => setIsShowSort(!isShowSort)}
                >
                  <div className=" sort  " data-toggle="dropdown">
                    <i
                      className="fa fa-sort-amount-asc"
                      aria-hidden="true"
                      style={{
                        marginRight: "5px",
                        fontSize: "14px",
                        color: `${iconColor}`
                      }}
                    ></i>
                    <span
                      style={{
                        fontSize: "15px",
                        color: `${iconColor}`
                      }}
                    >
                      {selectedSort}
                    </span>
                  </div>
                  <div
                    className={
                      isShowSort ? "dropdown-menu show" : "dropdown-menu"
                    }
                    aria-labelledby="dropdownMenuButton"
                    aria-expanded={isShowSort ? "true" : "false"}
                  >
                    <span
                      onClick={() => {
                        setSelectedSort("Name");
                        sortApps("Name", null, pdfData);
                      }}
                      className="dropdown-item itemColor"
                    >
                      {selectedSort !== "Name" ? (
                        <i
                          className="fa fa-arrow-up"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      ) : (
                        <i
                          className="fa fa-check"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      )}
                      Name
                    </span>
                    <span
                      onClick={() => {
                        setSelectedSort("Date");
                        sortApps("Date", null, pdfData);
                      }}
                      className="dropdown-item itemColor"
                    >
                      {selectedSort !== "Date" ? (
                        <i
                          className="fa fa-arrow-up"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      ) : (
                        <i
                          className="fa fa-check"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      )}
                      Date
                    </span>
                    <hr className="hrStyle" />
                    <span
                      onClick={() => {
                        setSortingOrder("Accending");
                        sortApps(null, "Accending", pdfData);
                      }}
                      className="dropdown-item itemColor"
                    >
                      {sortingOrder !== "Accending" ? (
                        <i
                          className="fa fa-arrow-up"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      ) : (
                        <i
                          className="fa fa-check"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      )}
                      Accending
                    </span>
                    <span
                      onClick={() => {
                        setSortingOrder("Decending");
                        sortApps(null, "Decending", pdfData);
                      }}
                      className="dropdown-item itemColor"
                    >
                      {sortingOrder !== "Decending" ? (
                        <i
                          className="fa fa-arrow-up"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      ) : (
                        <i
                          className="fa fa-check"
                          aria-hidden="true"
                          style={{ marginRight: "5px" }}
                        ></i>
                      )}
                      Decending
                    </span>
                  </div>
                </div>

                <div>
                  {isList ? (
                    <div className="sort" onClick={() => setIsList(!isList)}>
                      <i
                        onClick={() => setIsList(!isList)}
                        className="fa fa-th-large"
                        style={{ fontSize: "24px", color: `${iconColor}` }}
                        aria-hidden="true"
                      ></i>
                    </div>
                  ) : (
                    <div className="sort" onClick={() => setIsList(!isList)}>
                      <i
                        className="fa fa-list"
                        aria-hidden="true"
                        style={{ fontSize: "23px", color: `${iconColor}` }}
                      ></i>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {pdfData && pdfData.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "50vh",
                  width: "100%"
                }}
              >
                <span style={{ fontWeight: "bold" }}>No Data Found!</span>
              </div>
            ) : (
              <DriveBody
                pdfData={pdfData}
                setFolderName={setFolderName}
                setIsLoading={setIsLoading}
                setDocId={setDocId}
                getPdfFolderDocumentList={getPdfFolderDocumentList}
                getPdfDocumentList={getPdfDocumentList}
                isDocId={docId}
                setPdfData={setPdfData}
                isList={isList}
                setIsAlert={setIsAlert}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Opensigndrive;
