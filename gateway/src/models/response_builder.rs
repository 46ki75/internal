use chrono::Utc;
use chrono_tz::Asia::Tokyo;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct NormalResponseBuilder<T: Serialize> {
    meta: Meta,
    data: Option<Vec<T>>,
    links: Links,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Meta {
    id: String,
    total_pages: Option<u32>,
    timestamp: String,
}

#[derive(Serialize, Deserialize)]
struct Links {
    #[serde(rename = "self")]
    self_link: Option<String>,
    #[serde(rename = "first")]
    first_link: Option<String>,
    #[serde(rename = "prev")]
    prev_link: Option<String>,
    #[serde(rename = "next")]
    next_link: Option<String>,
    #[serde(rename = "last")]
    last_link: Option<String>,
}

#[allow(dead_code)]
impl<T: Serialize> NormalResponseBuilder<T> {
    pub fn new() -> Self {
        Self {
            meta: Meta {
                id: String::from(Uuid::new_v4()),
                total_pages: None,
                timestamp: String::from(""),
            },
            data: None,
            links: Links {
                self_link: None,
                first_link: None,
                prev_link: None,
                next_link: None,
                last_link: None,
            },
        }
    }

    pub fn total_pages(mut self, total_pages: u32) -> Self {
        self.meta.total_pages = Some(total_pages);
        self
    }

    pub fn data(mut self, data: Vec<T>) -> Self {
        self.data = Some(data);
        self
    }

    pub fn push_data(mut self, data: T) -> Self {
        match self.data {
            Some(ref mut vec) => vec.push(data),
            None => self.data = Some(vec![data]),
        };
        self
    }

    pub fn self_link<S: AsRef<str>>(mut self, self_link: S) -> Self {
        self.links.self_link = Some(self_link.as_ref().to_string());
        self
    }

    pub fn first_link<S: AsRef<str>>(mut self, first_link: S) -> Self {
        self.links.first_link = Some(first_link.as_ref().to_string());
        self
    }

    pub fn prev_link<S: AsRef<str>>(mut self, prev_link: S) -> Self {
        self.links.prev_link = Some(prev_link.as_ref().to_string());
        self
    }

    pub fn next_link<S: AsRef<str>>(mut self, next_link: S) -> Self {
        self.links.next_link = Some(next_link.as_ref().to_string());
        self
    }

    pub fn last_link<S: AsRef<str>>(mut self, last_link: S) -> Self {
        self.links.last_link = Some(last_link.as_ref().to_string());
        self
    }

    pub fn build(mut self) -> Self {
        self.data.get_or_insert_with(Vec::new);
        self.meta.timestamp = Utc::now().with_timezone(&Tokyo).to_rfc3339();
        self
    }
}

#[derive(Serialize, Deserialize)]
pub struct ErrResponseBuilder {
    id: String,
    code: u16,
    status: String,
    source: Source,
    title: String,
    detail: Option<String>,
    timestamp: String,
}

#[derive(Serialize, Deserialize)]
struct Source {
    pointer: Option<String>,
    parameter: Option<String>,
}

#[allow(dead_code)]
impl ErrResponseBuilder {
    pub fn new(code: u16) -> Self {
        let status = match code {
            400 => "Bad Request",
            401 => "Unauthorized",
            403 => "Forbidden",
            404 => "Not Found",
            405 => "Method Not Allowed",
            406 => "Not Acceptable",
            408 => "Request Timeout",
            409 => "Conflict",
            410 => "Gone",
            411 => "Length Required",
            412 => "Precondition Failed",
            413 => "Payload Too Large",
            414 => "URI Too Long",
            415 => "Unsupported Media Type",
            416 => "Range Not Satisfiable",
            417 => "Expectation Failed",
            422 => "Unprocessable Entity",
            423 => "Locked",
            424 => "Failed Dependency",
            426 => "Upgrade Required",
            428 => "Precondition Required",
            429 => "Too Many Requests",
            431 => "Request Header Fields Too Large",
            451 => "Unavailable For Legal Reasons",
            500 => "Internal Server Error",
            501 => "Not Implemented",
            502 => "Bad Gateway",
            503 => "Service Unavailable",
            504 => "Gateway Timeout",
            505 => "HTTP Version Not Supported",
            507 => "Insufficient Storage",
            508 => "Loop Detected",
            510 => "Not Extended",
            511 => "Network Authentication Required",
            _ => "Unknown Error",
        };

        Self {
            id: Uuid::new_v4().to_string(),
            code,
            status: String::from(status),
            source: Source {
                pointer: None,
                parameter: None,
            },
            title: String::from(status),
            detail: None,
            timestamp: String::from(""),
        }
    }

    pub fn detail<S: AsRef<str>>(mut self, detail: S) -> Self {
        self.detail = Some(detail.as_ref().to_string());
        self
    }

    pub fn pointer<S: AsRef<str>>(mut self, pointer: S) -> Self {
        self.source.pointer = Some(pointer.as_ref().to_string());
        self
    }

    pub fn parameter<S: AsRef<str>>(mut self, parameter: S) -> Self {
        self.source.parameter = Some(parameter.as_ref().to_string());
        self
    }

    pub fn build(mut self) -> Self {
        self.timestamp = Utc::now().with_timezone(&Tokyo).to_rfc3339();
        self
    }
}
