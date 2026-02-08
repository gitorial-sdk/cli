use crate::profile::Profile;

#[derive(Debug)]
pub struct User {
    name: String,
    age: u8,
    profile: Option<Profile>,
}

impl User {
    pub fn new(name: impl Into<String>, age: u8) -> Self {
        Self {
            name: name.into(),
            age,
            profile: None,
        }
    }

    pub fn with_profile(mut self, profile: Profile) -> Self {
        self.profile = Some(profile);
        self
    }

    pub fn summary(&self) -> String {
        let bio = match &self.profile {
            Some(profile) => profile.bio.as_str(),
            None => "no bio yet",
        };
        format!("{} ({}) - {}", self.name, self.age, bio)
    }
}
