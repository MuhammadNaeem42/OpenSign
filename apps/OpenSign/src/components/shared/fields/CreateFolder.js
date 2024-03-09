import React, { useEffect, useState } from "react";
import Parse from "parse";
import Alert from "../../../primitives/Alert";

const CreateFolder = ({ parentFolderId, onSuccess, folderCls }) => {
  const folderPtr = {
    __type: "Pointer",
    className: folderCls,
    objectId: parentFolderId
  };
  const [name, setName] = useState("");
  const [folderList, setFolderList] = useState([]);
  const [isAlert, setIsAlert] = useState(false);
  const [selectedParent, setSelectedParent] = useState();
  const [alert, setAlert] = useState({ type: "info", message: "" });
  useEffect(() => {
    fetchFolder();
    // eslint-disable-next-line
  }, []);

  const fetchFolder = async () => {
    try {
      const FolderQuery = new Parse.Query(folderCls);
      if (parentFolderId) {
        FolderQuery.equalTo("Folder", folderPtr);
        FolderQuery.equalTo("Type", "Folder");
      } else {
        FolderQuery.doesNotExist("Folder");
        FolderQuery.equalTo("Type", "Folder");
      }

      const res = await FolderQuery.find();
      if (res) {
        const result = JSON.parse(JSON.stringify(res));
        if (result) {
          setFolderList(result);
        }
      }
    } catch (error) {
      console.log("Err ", error);
    }
  };
  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (name) {
      const currentUser = Parse.User.current();
      const exsitQuery = new Parse.Query(folderCls);
      exsitQuery.equalTo("Name", name);
      exsitQuery.equalTo("Type", "Folder");
      if (parentFolderId) {
        exsitQuery.equalTo("Folder", folderPtr);
      }
      const templExist = await exsitQuery.first();
      if (templExist) {
        setAlert({ type: "dange", message: "Folder already exist!" });
        setIsAlert(true);
        setTimeout(() => {
          setIsAlert(false);
        }, 1000);
      } else {
        const template = new Parse.Object(folderCls);
        template.set("Name", name);
        template.set("Type", "Folder");

        if (selectedParent) {
          template.set("Folder", {
            __type: "Pointer",
            className: folderCls,
            objectId: selectedParent
          });
        } else if (parentFolderId) {
          template.set("Folder", folderPtr);
        }
        template.set("CreatedBy", Parse.User.createWithoutData(currentUser.id));
        const res = await template.save();
        if (res) {
          setAlert({
            type: "success",
            message: "Folder created successfully!"
          });
          setIsAlert(true);
          setTimeout(() => {
            setIsAlert(false);
          }, 1000);
          if (onSuccess) {
            onSuccess(res);
          }
        }
      }
    } else {
      setAlert({ type: "info", message: "Please fill folder name" });
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 1000);
    }
  };
  const handleOptions = (e) => {
    setSelectedParent(e.target.value);
  };
  return (
    <div>
      {isAlert && <Alert type={alert.type}>{alert.message}</Alert>}
      <div id="createFolder">
        <h1 className="text-base font-semibold">Create Folder</h1>
        <div className="text-xs mt-2">
          <label className="block">
            Name<span className="text-red-500 text-[13px]">*</span>
          </label>
          <input
            className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="text-xs mt-2">
          <label className="block">Parent Folder</label>
          <select
            value={selectedParent}
            onChange={handleOptions}
            className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
          >
            <option>select</option>
            {folderList.length > 0 &&
              folderList.map((x) => (
                <option key={x.objectId} value={x.objectId}>
                  {x.Name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <button
            onClick={handleCreateFolder}
            className="flex items-center rounded p-2 bg-[#32a3ac] text-white mt-3"
          >
            <i className="fa-solid fa-plus mr-1"></i>
            <span>Create</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFolder;
