import * as React from 'react'
import { Upload, Input, DatePicker, Tag, Button } from 'element-react'
import Dropzone from 'react-dropzone'
import styled from 'styled-components'
// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetUploadPartsDialogVisible } from './actions'

// helpers
import { serverURL } from './config'
import getAuthHeader from './authHeader'
import * as xlsx from 'xlsx'
import {readFileAsBuffer, readPartsFromExcel} from './tools'

const MyPanel = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
`
const MyDropzone = styled(Dropzone)`
  width:300px;
  height:200px;
  display:flex;
  border: solid 1px #000;
`
const DropzopnHint = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
`

interface IProps {
  sampleType: string,
  hideDialog: () => void
}

interface IState {
  parts: any[],
}

class UploadPartsDialog extends React.Component<IProps, IState> {
  public tagInputRef:React.RefObject<Input> = React.createRef()

  constructor(props:IProps) {
    super(props);
    this.state = {
      parts: [],
    }
  }  
  public render() {
    const {sampleType} = this.props;
    return (
      <MyPanel>
        <div>only modified xlsx from the <a href={`${serverURL}/public/bacterium_template.xlsx`}>template</a></div>
        <MyDropzone
          accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple = {false}
          onDrop={this.onDropFiles}
          rejectStyle={{
            borderColor:'#f00',
            backgroundColor:'#f77',
          }}
          acceptStyle={{
            borderColor:'#0f0',
            backgroundColor:'#7f7',
          }}
          >
          <DropzopnHint>
            drag and drop xlsx file to here or click
          </DropzopnHint>
        </MyDropzone>
      </MyPanel>
    )
  }

  private onCancel = () => {
    this.props.hideDialog();
  }
  private onDropFiles = async (acceptedFiles:File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const excelFile = acceptedFiles[0];
      const data = await readFileAsBuffer(excelFile);
      const workbook = xlsx.read(data, {type:'buffer'});
      console.log(workbook);
      readPartsFromExcel(workbook);
    }
  }
}

const mapStateToProps = (state :IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetUploadPartsDialogVisible(false)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UploadPartsDialog))
