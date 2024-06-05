import React, { createContext, useContext, useState } from "react";
import clsx from "clsx";

interface DetailsContextProps {
  isActive: boolean;
  toggle: () => void;
}

const DetailsContext = createContext<DetailsContextProps | undefined>(undefined);

interface DetailsProps {
  children: React.ReactNode;
  className?: string;
}

const Details: React.FC<DetailsProps> & { Item: React.FC<DetailsItemProps>; Content: React.FC<DetailsContentProps> } = ({ children, className }) => {
  return <div className={clsx("details", className)}>{children}</div>;
};

interface DetailsItemProps {
  children: (props: { isActive: boolean; toggle: () => void }) => React.ReactNode;
  className?: string;
}

const DetailsItem: React.FC<DetailsItemProps> = ({ children, className }: DetailsItemProps) => {
  const [isActive, setIsActive] = useState(false);

  const toggle = () => {
    setIsActive(!isActive);
  };

  return (
    <DetailsContext.Provider value={{ isActive, toggle }}>
      <div className={clsx("details-item", className)}>{children({ isActive, toggle })}</div>
    </DetailsContext.Provider>
  );
};

DetailsItem.displayName = "DetailsItem";

interface DetailsContentProps {
  children: React.ReactNode;
  className?: string;
}

const DetailsContent: React.FC<DetailsContentProps> = ({ children, className }: DetailsContentProps) => {
  const context = useContext(DetailsContext);

  if (!context) {
    throw new Error("Details.Content must be used within a Details.Item");
  }

  const { isActive } = context;

  return <div className={clsx("details-content", { "max-h-0 overflow-hidden": !isActive, "max-h-full": isActive }, className)}>{children}</div>;
};

DetailsContent.displayName = "DetailsContent";

Details.Item = DetailsItem;
Details.Content = DetailsContent;

export { Details };
