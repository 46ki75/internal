import React from "react";

import styles from "./Header.module.css";

export interface HeaderProps {
  style?: React.CSSProperties;
}

export const Header = (props: HeaderProps) => {
  return (
    <header className={styles["header"]} style={props.style}>
      HEADER
    </header>
  );
};
