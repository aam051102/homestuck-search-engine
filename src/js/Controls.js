import React, { useState } from "react";
import { MdCancel, MdEdit, MdSave } from "react-icons/md";

import "../css/Controls.scss";

const Controls = (props) => {
    const [isEditMode, setIsEditMode, ] = useState(false);
    const isSignedIn = true;

    return (
        <>
            {isSignedIn ? (
                <>
                    <button
                        className="control-btn control-edit"
                        onClick={() => {
                            if (isEditMode) {
                                if (props.exit) props.exit();
                                setIsEditMode(false);
                            } else {
                                setIsEditMode(true);
                            }
                        }}
                        aria-label="Edit tags"
                        title="Edit"
                    >
                        {
                            isEditMode ? 
                                <MdCancel /> :
                                <MdEdit />
                        }
                    </button>

                    {
                        isEditMode ? (
                            <button
                                className="control-btn control-save"
                                onClick={() => {
                                    if (props.save) props.save();
                                }}
                                aria-label="Save edits"
                                title="Save"
                            >
                                <MdSave />
                            </button>
                        ) : null
                    }
                </>
            ) : null}
        </>
    );
};

export default Controls;