import * as React from 'react';
import clsx from 'clsx';

import layout from '../../css/layout.module.css';
import styles from './Section.module.css';

export const Section: React.FC<
  React.PropsWithChildren<{
    className?: string;
    id?: string;
  }>
> = ({ className, children, id }) => {
  return (
    <section className={clsx(styles.section, className)} id={id}>
      <div className={layout.contentWrapper}>{children}</div>
    </section>
  );
};
