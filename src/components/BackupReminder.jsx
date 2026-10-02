import { useState } from "react";
import { Link } from "react-router-dom";
import { getLastBackup } from "../utils/backupInfo";
import "../css/BackupReminder.css";

const DAYS = 7;

export default function BackupReminder() {
  const [state] = useState(() => {
    const last = getLastBackup();
    if (!last) {
      return { due: true, text: "No backup has been made on this computer yet." };
    }
    const days = Math.floor((Date.now() - last.getTime()) / 86400000);
    return {
      due: days >= DAYS,
      text: `The last backup on this computer was ${days} days ago.`,
    };
  });

  if (!state.due) return null;

  return (
    <Link to="/backup" className="bkr">
      <strong>Time to back up your data</strong>
      <span>{state.text} Open Backup to download one.</span>
    </Link>
  );
}