import { IPart } from "types";
import * as React from 'react';
import { Table } from "element-react";
import axios from 'axios';
import { serverURL } from "config";
import { fileSizeHumanReadable } from "tools";
import getAuthHeader from "authHeader";

interface IProps {
  part: IPart
}

interface IState {

}

export default class PartAttachments extends React.Component<IProps, IState> {

  public render () {
    const {part} = this.props;
    return <div style={{cursor:'pointer'}}> 
    {
      part.attachments && part.attachments.length > 0 ?
        part.attachments.map(att => 
          <div key={att.fileId}>
            <a
              onClick={this.onClickAttachment.bind(this,att.fileId, att.fileName)}
            >
              {att.fileName},
              {fileSizeHumanReadable(att.fileSize)}
            </a>
          </div>) :
        <div>no attachments</div>
    }
  </div>
  }

  private onClickAttachment = async (fileId: string, fileName: string, e:React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const res = await axios({
      url: serverURL+`/api/attachment/${fileId}`,
      method: 'GET',
      responseType: 'blob', // important
      ...getAuthHeader(),
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
  }
}