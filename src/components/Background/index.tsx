import React from "react";

import "./index.scss";

type IProps = {
    src: string;
};

const Background: React.FC<IProps> = (props) => {
    return (
        <div className="background">
            <img src={props.src} />
        </div>
    );
};

export default Background;
