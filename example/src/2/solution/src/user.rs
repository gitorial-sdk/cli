#[derive(Debug)]
pub struct User {
    name: String,
    age: u8,
}

impl User {
    pub fn new(name: impl Into<String>, age: u8) -> Self {
        Self {
            name: name.into(),
            age,
        }
    }

    pub fn summary(&self) -> String {
        format!("{} ({} years old)", self.name, self.age)
    }
}
