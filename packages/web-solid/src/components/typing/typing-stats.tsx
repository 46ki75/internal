import styles from "./typing.module.css";

export interface TypingStatsProps {
  accuracy: number;
  progress: number;
  wordsPerMinute: number;
}

export const TypingStats = (props: TypingStatsProps) => (
  <dl class={styles.stats} aria-label="Typing statistics">
    <div>
      <dt>WPM</dt>
      <dd>{props.wordsPerMinute}</dd>
    </div>
    <div>
      <dt>Accuracy</dt>
      <dd>{props.accuracy}%</dd>
    </div>
    <div>
      <dt>Progress</dt>
      <dd>{props.progress}%</dd>
    </div>
  </dl>
);
