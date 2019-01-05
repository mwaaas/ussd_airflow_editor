import React from 'react'
import { Affix, Card, Col, Divider, Icon, Input, Row, Tag } from 'antd'
import { Route } from 'react-router-dom'
import { Base64 } from 'js-base64'
import mermaid from 'mermaid'

import Error from './Error'
import Preview from './Preview'
import pkg from '../../package.json'
import { base64ToState } from '../utils'
import axios from 'axios'
import { JsonEditor as Editor } from 'jsoneditor-react'
import 'jsoneditor-react/es/editor.min.css'
import ace from 'brace'
import 'brace/mode/json'
import 'brace/theme/github'

let mermaidVersion = pkg.dependencies.mermaid
if (mermaidVersion[0] === '^') {
  mermaidVersion = mermaidVersion.substring(1)
}

class Edit extends React.Component {
  constructor (props) {
    super(props)
    this.onCodeChange = this.onCodeChange.bind(this)
    this.onMermaidConfigChange = this.onMermaidConfigChange.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.getMermaidText = this.getMermaidText.bind(this)
    const { match: { params: { base64 } }, location: { search } } = this.props
    this.json = base64ToState(base64, search)
    mermaid.initialize(this.json.mermaid)
    this.state = { mermaidText: 'graph TD\nA ==> C' }
    this.getMermaidText()
  }
  getMermaidText () {
    axios.post('http://localhost:8007/ussd_airflow/mermaid_text',
      { journey: this.json.code }).then(response => {
      this.setState({ mermaidText: response.data.mermaidText })
    }).catch(
      err => {
        console.log('err:', err)
      })
  }
  onCodeChange (event) {
    const { history, match: { path } } = this.props
    this.json.code = event.target.value
    this.getMermaidText()
    const base64 = Base64.encodeURI(JSON.stringify(this.json))
    history.push(path.replace(':base64', base64))
  }

  onMermaidConfigChange (event) {
    const str = event.target.value
    const { history, match: { path, url } } = this.props
    try {
      const config = JSON.parse(str)
      mermaid.initialize(config)
      this.json.mermaid = config
      const base64 = Base64.encodeURI(JSON.stringify(this.json))
      history.push(path.replace(':base64', base64))
    } catch (e) {
      const base64 = Base64.encodeURI(e.message)
      history.push(`${url}/error/${base64}`)
    }
  }

  handleChange (content) {
    this.json.code = content
    this.getMermaidText()
  }

  validate (content) {
    // Add a response interceptor
    axios.interceptors.response.use((response) => {
      if (Array.isArray(response.data)) {
        console.log('errors:', response.data)
        return response.data
      }
      return response
    }, (error) => {
      return Promise.reject(error)
    })

    let promise = axios.post(
      'http://localhost:8007/ussd_airflow/validate_journey',
      { journey: content, error_type: 'mermaid_txt' }
    )
    return promise
  }
  render () {
    const { match: { url } } = this.props
    return <div>
      <h1>Airflow Ussd Live Editor</h1>
      <Divider />
      <Row gutter={16}>
        <Col span={8}>
          <Affix>
            <Editor
              value={this.json.code}
              onChange={this.handleChange}
              mode={'code'}
              ace={ace}
              theme='ace/theme/github'
              allowedModes={['code', 'tree']}
              onValidate={this.validate}
              history
            />
          </Affix>
          <Card title='Mermaid configuration'>
            <Input.TextArea autosize={{ minRows: 4, maxRows: 16 }} defaultValue={JSON.stringify(this.json.mermaid, null, 2)} onChange={this.onMermaidConfigChange} />
          </Card>
          <Card title='Links'>
            <ul className='marketing-links'>
              <li><a href='https://mermaidjs.github.io/' target='_blank'><Icon type='book' /> Mermaid Documentation</a></li>
              <li><a href='https://github.com/knsv/mermaid' target='_blank'><Icon type='github' /> Mermaid on GitHub</a></li>
              <li><a href='https://github.com/mermaidjs/mermaid-gitbook' target='_blank'><Icon type='github' /> Documentation on GitHub</a></li>
              <li><a href='https://github.com/mermaidjs/mermaid-live-editor' target='_blank'><Icon type='github' /> Live Editor on GitHub</a></li>
              <li><a href='https://github.com/mermaidjs/mermaid.cli' target='_blank'><Icon type='github' /> Mermaid CLI</a></li>
            </ul>
          </Card>
        </Col>
        <Col span={16}>
          <Route exact path={url} render={(props) => <Preview {...props} code={this.state.mermaidText} />} />
          <Route path={url + '/error/:base64'} component={Error} />
          <h3 style={{ textAlign: 'right' }}>Powered by mermaid <Tag color='green'>{mermaidVersion}</Tag></h3>
        </Col>
      </Row>
    </div>
  }
}

export default Edit
